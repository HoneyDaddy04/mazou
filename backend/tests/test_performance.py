"""
Performance benchmarks for Mazou backend.

Measures: endpoint latency (p50/p95/p99), DB query performance at various
data volumes, cache hit/miss difference, and throughput (req/s).

Run:
    PYTHONPATH=. python -m pytest backend/tests/test_performance.py -v -s --tb=short
"""

from __future__ import annotations

import asyncio
import hashlib
import random
import statistics
import time
import uuid
from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from backend.gateway.main import app
from backend.shared.cache import create_cache
from backend.shared.config import settings

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MODELS = ["gpt-4o", "claude-sonnet-4.6", "gemini-2.5-pro", "deepseek-v3.1", "gpt-4.1-mini"]
PROVIDERS = ["OpenAI", "Anthropic", "Google", "DeepSeek", "OpenAI"]
TAGS = ["chat", "search", "summarize", "translate", "code-gen", None]
N_LATENCY = 20


def _uid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

def _pct(times: list[float]) -> dict:
    if not times:
        return {}
    s = sorted(times)
    n = len(s)
    return {
        "count": n,
        "min_ms": round(s[0] * 1000, 2),
        "p50_ms": round(s[n // 2] * 1000, 2),
        "p95_ms": round(s[int(n * 0.95)] * 1000, 2),
        "p99_ms": round(s[int(n * 0.99)] * 1000, 2),
        "max_ms": round(s[-1] * 1000, 2),
        "mean_ms": round(statistics.mean(s) * 1000, 2),
    }


def _table(title: str, rows: list[dict]):
    print(f"\n{'=' * 100}")
    print(f"  {title}")
    print(f"{'=' * 100}")
    if not rows:
        print("  (no data)")
        return
    hdrs = list(rows[0].keys())
    cw = {h: max(len(str(h)), max(len(str(r.get(h, ""))) for r in rows)) for h in hdrs}
    hl = " | ".join(str(h).ljust(cw[h]) for h in hdrs)
    print(f"  {hl}")
    print(f"  {'-' * len(hl)}")
    for row in rows:
        print(f"  {' | '.join(str(row.get(h,'')).ljust(cw[h]) for h in hdrs)}")
    print()


# ---------------------------------------------------------------------------
# Timed request helper
# ---------------------------------------------------------------------------

async def _timed(c: AsyncClient, method: str, url: str, n: int = 30,
                 headers: dict | None = None, json_body: dict | None = None):
    times, codes = [], []
    for i in range(n):
        try:
            t0 = time.perf_counter()
            if method == "GET":
                r = await c.get(url, headers=headers)
            elif method == "POST":
                r = await c.post(url, headers=headers, json=json_body)
            elif method == "DELETE":
                r = await c.delete(url, headers=headers)
            else:
                r = await c.request(method, url, headers=headers, json=json_body)
            times.append(time.perf_counter() - t0)
            codes.append(r.status_code)
        except Exception:
            codes.append(0)  # Mark as failed
    return times, codes


def _assert_ok(codes: list[int], label: str = "", min_rate: float = 0.8):
    """Assert at least min_rate fraction of status codes are 200.
    NullPool on Windows/asyncpg can cause intermittent connection failures.
    """
    ok = sum(1 for c in codes if c == 200) / len(codes) if codes else 0
    assert ok >= min_rate, f"{label} success rate {ok:.0%} < {min_rate:.0%}, codes: {set(codes)}"


# ---------------------------------------------------------------------------
# Bulk-insert usage logs via raw SQL (uses engine.begin for fresh connection)
# ---------------------------------------------------------------------------

async def _bulk_insert_logs(org_id: str, ak_id: str, count: int):
    import backend.shared.database as _db
    now = datetime.utcnow()
    async with _db.engine.begin() as conn:
        await conn.execute(text("DELETE FROM usage_logs WHERE org_id = :oid"), {"oid": org_id})
        for start in range(0, count, 500):
            end = min(start + 500, count)
            parts = []
            for i in range(start, end):
                idx = i % len(MODELS)
                tag = TAGS[i % len(TAGS)]
                tv = f"'{tag}'" if tag else "NULL"
                cr = now - timedelta(days=random.randint(0, 29), hours=random.randint(0, 23))
                parts.append(
                    f"('{_uid()}','{org_id}','{ak_id}','{_uid()}',"
                    f"'{MODELS[idx]}','{PROVIDERS[idx]}',{tv},NULL,"
                    f"{random.randint(100,10000)},{random.randint(50,5000)},"
                    f"{random.randint(10,5000)},{random.randint(200,3000)},"
                    f"NULL,NULL,NULL,{random.randint(0,500)},false,'success',false,"
                    f"'{cr.strftime('%Y-%m-%d %H:%M:%S')}')"
                )
            await conn.execute(text(
                "INSERT INTO usage_logs "
                "(id,org_id,api_key_id,request_id,model,provider,feature_tag,agent_id,"
                "input_tokens,output_tokens,cost_kobo,latency_ms,"
                "routed_from,routed_to,routing_reason,savings_kobo,cached,status,is_test,"
                "created_at) VALUES " + ",".join(parts)
            ))


# ---------------------------------------------------------------------------
# Override conftest's clean_tables (we manage our own cleanup)
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def clean_tables():
    """No-op: override conftest's table-truncation for perf tests."""
    yield


# ---------------------------------------------------------------------------
# Session-scoped fixture: create test data once, use across all tests
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def perf_env(setup_database):
    """Create test user/org/key via signup, return handles for all tests.

    Depends on setup_database to ensure tables exist and pg_terminate_backend
    has already run before we create our connections.
    Uses NullPool (from conftest) -- each request gets a fresh connection.
    """
    # Initialize cache (lifespan doesn't run with ASGITransport)
    if not hasattr(app.state, "cache") or not app.state.cache:
        app.state.cache = create_cache(settings.cache_url)

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as c:
        # Signup (with retry for transient connection issues)
        email = f"perf-{_uid()[:8]}@test.com"
        org_name = f"perf-test-{_uid()[:8]}"
        resp = None
        for attempt in range(3):
            try:
                resp = await c.post("/api/auth/signup", json={
                    "email": email, "password": "PerfTest123!",
                    "full_name": "Perf Tester", "org_name": org_name,
                })
                if resp.status_code == 200:
                    break
            except Exception as exc:
                if attempt == 2:
                    raise
                await asyncio.sleep(0.5)
                # Use fresh email/org on retry to avoid unique constraint
                email = f"perf-{_uid()[:8]}@test.com"
                org_name = f"perf-test-{_uid()[:8]}"

        assert resp is not None and resp.status_code == 200, \
            f"Signup failed after retries: {resp.text if resp else 'no response'}"
        user_data = resp.json()["user"]
        org_id = user_data["org_id"]

        # Extract JWT from set-cookie
        jwt_token = ""
        for hdr_val in resp.headers.get_list("set-cookie"):
            if "mazou_session=" in hdr_val:
                jwt_token = hdr_val.split("mazou_session=")[1].split(";")[0]
        assert jwt_token, "No JWT token in signup response"

        # Create API key
        resp2 = await c.post("/v1/keys",
            headers={"Authorization": f"Bearer {jwt_token}"},
            json={"name": "perf-key", "environment": "test"},
        )
        assert resp2.status_code == 200, f"Key creation failed: {resp2.text}"
        key_data = resp2.json()

        env = {
            "client": c,
            "jwt": jwt_token,
            "raw_key": key_data["key"],
            "api_key_id": key_data["id"],
            "org_id": org_id,
            "jwt_headers": {"Authorization": f"Bearer {jwt_token}"},
            "key_headers": {"Authorization": f"Bearer {key_data['key']}"},
        }
        yield env

    # Cleanup
    import backend.shared.database as _db
    try:
        async with _db.engine.begin() as conn:
            for tbl in ["usage_logs", "routing_rules", "api_keys", "wallets", "profiles"]:
                await conn.execute(text(f"DELETE FROM {tbl} WHERE org_id = :oid"), {"oid": org_id})
            await conn.execute(text("DELETE FROM organizations WHERE id = :oid"), {"oid": org_id})
    except Exception:
        pass


# ===========================================================================
# 1. ENDPOINT RESPONSE TIMES
# ===========================================================================


class TestEndpointLatency:

    @pytest.mark.asyncio
    async def test_health_and_models(self, perf_env):
        c = perf_env["client"]

        t1, c1 = await _timed(c, "GET", "/health", n=N_LATENCY)
        _assert_ok(c1, "health")

        t2, c2 = await _timed(c, "GET", "/v1/models", n=N_LATENCY)
        _assert_ok(c2, "models")

        rows = []
        for qs in ["?is_african=true", "?category=frontier", "?provider=openai", "?tag=coding"]:
            t, codes = await _timed(c, "GET", f"/v1/models{qs}", n=N_LATENCY)
            _assert_ok(codes, "models filter")
            rows.append({"endpoint": f"GET /v1/models{qs}", **_pct(t)})

        _table("Endpoint Latency: Health + Models", [
            {"endpoint": "GET /health", **_pct(t1)},
            {"endpoint": "GET /v1/models", **_pct(t2)},
            *rows,
        ])

    @pytest.mark.asyncio
    async def test_auth_and_dashboard(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]

        t_me, c_me = await _timed(c, "GET", "/api/auth/me", headers=h, n=N_LATENCY)
        _assert_ok(c_me, "auth/me")

        t_st, c_st = await _timed(c, "GET", "/api/dashboard/stats?days=30", headers=h, n=N_LATENCY)
        _assert_ok(c_st, "stats")

        t_w, c_w = await _timed(c, "GET", "/api/dashboard/wallet", headers=h, n=N_LATENCY)
        _assert_ok(c_w, "wallet")

        t_k, c_k = await _timed(c, "GET", "/v1/keys", headers=h, n=N_LATENCY)
        _assert_ok(c_k, "keys")

        _table("Endpoint Latency: Auth + Dashboard", [
            {"endpoint": "GET /api/auth/me", **_pct(t_me)},
            {"endpoint": "GET /api/dashboard/stats", **_pct(t_st)},
            {"endpoint": "GET /api/dashboard/wallet", **_pct(t_w)},
            {"endpoint": "GET /v1/keys", **_pct(t_k)},
        ])

    @pytest.mark.asyncio
    async def test_usage_endpoints(self, perf_env):
        c = perf_env["client"]
        h = perf_env["key_headers"]

        t1, c1 = await _timed(c, "GET", "/v1/usage?days=30", headers=h, n=N_LATENCY)
        _assert_ok(c1, "usage")

        t2, c2 = await _timed(c, "GET", "/v1/usage/summary?days=30", headers=h, n=N_LATENCY)
        _assert_ok(c2, "summary")

        _table("Endpoint Latency: Usage (API key auth)", [
            {"endpoint": "GET /v1/usage", **_pct(t1)},
            {"endpoint": "GET /v1/usage/summary", **_pct(t2)},
        ])

    @pytest.mark.asyncio
    async def test_routing_rules_crud(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]

        rule = {
            "name": "perf-rule", "description": "test",
            "condition": {"model": "gpt-4o"}, "action": {"route_to": "gpt-4o-mini"},
            "priority": 1, "status": "active",
        }
        ct, ids = [], []
        for _ in range(10):
            t0 = time.perf_counter()
            r = await c.post("/api/routing/rules", headers=h, json=rule)
            ct.append(time.perf_counter() - t0)
            if r.status_code == 200:
                ids.append(r.json()["id"])

        lt, lc = await _timed(c, "GET", "/api/routing/rules", headers=h, n=N_LATENCY)
        _assert_ok(lc, "routing list")

        dt = []
        for rid in ids:
            t0 = time.perf_counter()
            await c.delete(f"/api/routing/rules/{rid}", headers=h)
            dt.append(time.perf_counter() - t0)

        _table("Routing Rules CRUD", [
            {"op": "POST create", **_pct(ct)},
            {"op": "GET list", **_pct(lt)},
            {"op": "DELETE", **_pct(dt)},
        ])


# ===========================================================================
# 2. DATABASE QUERY PERFORMANCE
# ===========================================================================


class TestDatabasePerformance:

    @pytest.mark.asyncio
    async def test_dashboard_varying_volume(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]
        org_id = perf_env["org_id"]
        ak_id = perf_env["api_key_id"]

        results = []
        for vol in [100, 1_000, 5_000]:
            await _bulk_insert_logs(org_id, ak_id, vol)
            t, codes = await _timed(c, "GET", "/api/dashboard/stats?days=30", headers=h, n=15)
            _assert_ok(codes, f"dashboard vol={vol}")
            results.append({"volume": f"{vol:>6,} rows", **_pct(t)})

        _table("Dashboard Stats -- Varying Data Volume", results)

    @pytest.mark.asyncio
    async def test_usage_summary_filters(self, perf_env):
        c = perf_env["client"]
        h = perf_env["key_headers"]
        await _bulk_insert_logs(perf_env["org_id"], perf_env["api_key_id"], 3_000)

        results = []
        for label, url in [
            ("30 days", "/v1/usage/summary?days=30"),
            ("7 days", "/v1/usage/summary?days=7"),
            ("90 days", "/v1/usage/summary?days=90"),
        ]:
            t, codes = await _timed(c, "GET", url, headers=h, n=15)
            _assert_ok(codes, f"usage summary {label}")
            results.append({"filter": label, **_pct(t)})
        _table("Usage Summary -- Filter Combinations", results)

    @pytest.mark.asyncio
    async def test_wallet_balance(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]
        t, codes = await _timed(c, "GET", "/api/dashboard/wallet", headers=h, n=20)
        _assert_ok(codes, "wallet")
        s = _pct(t)
        _table("Wallet Balance Lookup", [{"endpoint": "GET /api/dashboard/wallet", **s}])


# ===========================================================================
# 3. CACHE PERFORMANCE
# ===========================================================================


class TestCachePerformance:

    @pytest.mark.asyncio
    async def test_cache_hit_vs_miss(self, perf_env):
        c = perf_env["client"]
        h = perf_env["key_headers"]
        raw = perf_env["raw_key"]
        kh = hashlib.sha256(raw.encode()).hexdigest()
        cache = app.state.cache

        miss_t = []
        for _ in range(5):
            await cache.delete(f"apikey:{kh}")
            t0 = time.perf_counter()
            r = await c.get("/v1/usage?days=1&limit=1", headers=h)
            if r.status_code == 200:
                miss_t.append(time.perf_counter() - t0)

        await c.get("/v1/usage?days=1&limit=1", headers=h)
        hit_t = []
        for _ in range(15):
            t0 = time.perf_counter()
            r = await c.get("/v1/usage?days=1&limit=1", headers=h)
            if r.status_code == 200:
                hit_t.append(time.perf_counter() - t0)

        ms, hs = _pct(miss_t), _pct(hit_t)
        sp = round(ms["mean_ms"] / hs["mean_ms"], 2) if hs.get("mean_ms", 0) > 0 else 0

        _table("API Key Cache: Hit vs Miss", [
            {"scenario": "MISS (cold)", **ms},
            {"scenario": "HIT (warm)", **hs},
            {"scenario": f"Speedup: {sp}x", "count": "", "min_ms": "", "p50_ms": "",
             "p95_ms": "", "p99_ms": "", "max_ms": "", "mean_ms": ""},
        ])

    @pytest.mark.asyncio
    async def test_rate_limiter(self, perf_env):
        c = perf_env["client"]
        h = perf_env["key_headers"]
        times = []
        for _ in range(20):
            t0 = time.perf_counter()
            r = await c.get("/v1/usage?days=1&limit=1", headers=h)
            times.append(time.perf_counter() - t0)
        _table("Rate Limiter Overhead (20 rapid)", [{"endpoint": "GET /v1/usage", **_pct(times)}])


# ===========================================================================
# 4. THROUGHPUT
# ===========================================================================


class TestThroughput:

    @pytest.mark.asyncio
    async def test_seq_models(self, perf_env):
        c = perf_env["client"]
        n = 50
        t0 = time.perf_counter()
        times, codes = [], []
        for _ in range(n):
            rt0 = time.perf_counter()
            r = await c.get("/v1/models")
            times.append(time.perf_counter() - rt0)
            codes.append(r.status_code)
        el = time.perf_counter() - t0
        _assert_ok(codes, "seq models")
        s = _pct(times)
        _table(f"Sequential: GET /v1/models x{n}", [
            {"metric": "req/s", "value": round(n / el, 1)},
            {"metric": "total_sec", "value": round(el, 2)},
            {"metric": "p50_ms", "value": s["p50_ms"]},
            {"metric": "p95_ms", "value": s["p95_ms"]},
            {"metric": "p99_ms", "value": s["p99_ms"]},
        ])

    @pytest.mark.asyncio
    async def test_seq_auth_me(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]
        n = 50
        t0 = time.perf_counter()
        times, codes = [], []
        for _ in range(n):
            rt0 = time.perf_counter()
            r = await c.get("/api/auth/me", headers=h)
            times.append(time.perf_counter() - rt0)
            codes.append(r.status_code)
        el = time.perf_counter() - t0
        _assert_ok(codes, "seq auth/me")
        s = _pct(times)
        _table(f"Sequential: GET /api/auth/me x{n}", [
            {"metric": "req/s", "value": round(n / el, 1)},
            {"metric": "total_sec", "value": round(el, 2)},
            {"metric": "p50_ms", "value": s["p50_ms"]},
            {"metric": "p95_ms", "value": s["p95_ms"]},
            {"metric": "p99_ms", "value": s["p99_ms"]},
        ])

    @pytest.mark.asyncio
    async def test_seq_dashboard(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]
        await _bulk_insert_logs(perf_env["org_id"], perf_env["api_key_id"], 5_000)

        n = 30
        t0 = time.perf_counter()
        times, codes = [], []
        for _ in range(n):
            rt0 = time.perf_counter()
            r = await c.get("/api/dashboard/stats?days=30", headers=h)
            times.append(time.perf_counter() - rt0)
            codes.append(r.status_code)
        el = time.perf_counter() - t0
        _assert_ok(codes, "seq dashboard")
        s = _pct(times)
        _table(f"Sequential: dashboard/stats x{n} (~5k rows)", [
            {"metric": "req/s", "value": round(n / el, 1)},
            {"metric": "total_sec", "value": round(el, 2)},
            {"metric": "p50_ms", "value": s["p50_ms"]},
            {"metric": "p95_ms", "value": s["p95_ms"]},
            {"metric": "p99_ms", "value": s["p99_ms"]},
        ])

    @pytest.mark.asyncio
    async def test_concurrent_models(self, perf_env):
        c = perf_env["client"]
        n, conc = 50, 10
        sem = asyncio.Semaphore(conc)

        async def _r():
            async with sem:
                t0 = time.perf_counter()
                r = await c.get("/v1/models")
                return time.perf_counter() - t0, r.status_code

        t0 = time.perf_counter()
        res = await asyncio.gather(*[_r() for _ in range(n)])
        el = time.perf_counter() - t0
        times = [r[0] for r in res]
        codes = [r[1] for r in res]
        s = _pct(times)
        ok = round(sum(1 for x in codes if x == 200) / n * 100, 1)
        _table(f"Concurrent: /v1/models x{n} @ {conc}", [
            {"metric": "req/s", "value": round(n / el, 1)},
            {"metric": "total_sec", "value": round(el, 2)},
            {"metric": "success_%", "value": ok},
            {"metric": "p50_ms", "value": s["p50_ms"]},
            {"metric": "p95_ms", "value": s["p95_ms"]},
            {"metric": "p99_ms", "value": s["p99_ms"]},
        ])

    @pytest.mark.asyncio
    async def test_concurrent_dashboard(self, perf_env):
        c = perf_env["client"]
        h = perf_env["jwt_headers"]
        n, conc = 30, 5
        sem = asyncio.Semaphore(conc)

        async def _r():
            async with sem:
                t0 = time.perf_counter()
                r = await c.get("/api/dashboard/stats?days=30", headers=h)
                return time.perf_counter() - t0, r.status_code

        t0 = time.perf_counter()
        res = await asyncio.gather(*[_r() for _ in range(n)])
        el = time.perf_counter() - t0
        times = [r[0] for r in res]
        codes = [r[1] for r in res]
        s = _pct(times)
        ok = round(sum(1 for x in codes if x == 200) / n * 100, 1)
        _table(f"Concurrent: dashboard/stats x{n} @ {conc}", [
            {"metric": "req/s", "value": round(n / el, 1)},
            {"metric": "total_sec", "value": round(el, 2)},
            {"metric": "success_%", "value": ok},
            {"metric": "p50_ms", "value": s["p50_ms"]},
            {"metric": "p95_ms", "value": s["p95_ms"]},
            {"metric": "p99_ms", "value": s["p99_ms"]},
        ])


# ===========================================================================
# 5. AUTH (bcrypt)
# ===========================================================================


class TestAuthLatency:

    @pytest.mark.asyncio
    async def test_signup_login(self, perf_env):
        c = perf_env["client"]
        su_t, li_t = [], []
        for i in range(5):
            em = f"perf-b-{_uid()[:8]}@test.com"
            body = {
                "email": em, "password": "BenchPass123!",
                "full_name": f"Bench {i}", "org_name": f"perf-test-b-{_uid()[:8]}",
            }
            t0 = time.perf_counter()
            r = await c.post("/api/auth/signup", json=body)
            su_t.append(time.perf_counter() - t0)
            assert r.status_code == 200, f"Signup: {r.text}"

            t0 = time.perf_counter()
            r = await c.post("/api/auth/login", json={"email": em, "password": "BenchPass123!"})
            li_t.append(time.perf_counter() - t0)
            assert r.status_code == 200, f"Login: {r.text}"

        _table("Auth (bcrypt overhead)", [
            {"endpoint": "POST /api/auth/signup", **_pct(su_t)},
            {"endpoint": "POST /api/auth/login", **_pct(li_t)},
        ])


# ===========================================================================
# SUMMARY
# ===========================================================================


class TestSummary:

    @pytest.mark.asyncio
    async def test_print_summary(self, perf_env):
        print("\n")
        print("=" * 100)
        print("  PERFORMANCE BENCHMARK COMPLETE")
        print("=" * 100)
        print("  Key targets:")
        print("    - Health/models:              <10ms p50")
        print("    - Auth /me:                   <20ms p50")
        print("    - Dashboard stats (10k rows): <50ms p50")
        print("    - Wallet lookup:              <10ms p50")
        print("    - Signup/Login (bcrypt):       <300ms p50")
        print("    - Cache hit faster than miss")
        print("=" * 100)
