"""
Stress tests for Mazou backend: concurrency, race conditions, system limits.

Run from project root:
  PYTHONPATH=. python -m pytest backend/tests/stress/test_stress.py -v --tb=short \
    --noconftest -p pytest_asyncio -o "asyncio_mode=auto" \
    -o "asyncio_default_fixture_loop_scope=session"

Self-contained: inline fixtures, no conftest dependency.
Each test creates a fresh NullPool engine to avoid asyncpg event-loop binding.
Uses unique org IDs so tests don't interfere with each other.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import uuid
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from backend.shared.models import ApiKey, Base, Organization, Profile, Wallet
from backend.billing.wallet import (
    InsufficientBalanceError,
    DuplicateTransactionError,
    credit_wallet,
    debit_wallet,
    get_wallet_balance,
)
from backend.gateway.middleware.auth import create_access_token, hash_password
from backend.shared.cache import MemoryCache

DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/mazou",
)


# ---------------------------------------------------------------------------
# Per-test engine context manager (NullPool = no event-loop binding issues)
# ---------------------------------------------------------------------------


@asynccontextmanager
async def fresh_db():
    """
    Create a NullPool engine, patch db module, yield session factory.
    NullPool creates a fresh connection per checkout and closes it immediately,
    so there are no persistent connections that bind to a specific event loop.
    """
    import backend.shared.database as db_mod
    old_eng, old_sf = db_mod.engine, db_mod.AsyncSessionLocal

    # Dispose the import-time engine to free connections and avoid conflicts.
    # Use a brand-new NullPool engine for each test.
    try:
        await old_eng.dispose()
    except Exception:
        pass

    eng = create_async_engine(DB_URL, echo=False, poolclass=NullPool)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    sf = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)

    db_mod.engine = eng
    db_mod.AsyncSessionLocal = sf

    from backend.gateway.main import app
    if not hasattr(app.state, "cache") or app.state.cache is None:
        app.state.cache = MemoryCache()

    try:
        yield sf
    finally:
        db_mod.engine = old_eng
        db_mod.AsyncSessionLocal = old_sf
        await eng.dispose()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def new_org(sf, balance_kobo=0):
    async with sf() as db:
        org = Organization(name="Stress", slug=f"s-{uuid.uuid4().hex[:8]}")
        db.add(org)
        await db.flush()
        prof = Profile(
            org_id=org.id,
            email=f"s-{uuid.uuid4().hex[:6]}@t.com",
            password=hash_password("testpass12345"),
            full_name="T", role="owner",
        )
        db.add(prof)
        w = Wallet(org_id=org.id, currency="NGN", balance_kobo=balance_kobo)
        db.add(w)
        await db.commit()
        await db.refresh(org)
        await db.refresh(prof)
        await db.refresh(w)
        return org, prof, w


def make_jwt(prof):
    return create_access_token(prof.id, prof.org_id)


def app_client():
    from backend.gateway.main import app
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://test")


async def bounded_gather(coros, limit=15):
    """Run coroutines with bounded concurrency to avoid overwhelming NullPool."""
    sem = asyncio.Semaphore(limit)

    async def limited(coro):
        async with sem:
            return await coro

    return await asyncio.gather(*[limited(c) for c in coros])


# ===========================================================================
# 1. WALLET RACE CONDITIONS (CRITICAL)
# ===========================================================================


class TestWalletRaceConditions:

    @pytest.mark.asyncio
    async def test_concurrent_debits_never_go_negative(self):
        """50 concurrent debits of 500 against 10000 balance."""
        async with fresh_db() as sf:
            org, _, w = await new_org(sf, 10_000)

            async def debit(i):
                async with sf() as s:
                    try:
                        await debit_wallet(s, org.id, 500, f"d-{i}", f"d{i}-{w.id}")
                        await s.commit()
                        return "ok"
                    except InsufficientBalanceError:
                        await s.rollback()
                        return "nsf"
                    except Exception as e:
                        await s.rollback()
                        return f"err:{e}"

            results = await bounded_gather([debit(i) for i in range(50)])

            async with sf() as s:
                bal = await get_wallet_balance(s, org.id)

            ok = results.count("ok")
            nsf = results.count("nsf")
            errs = [r for r in results if r.startswith("err:")]

            assert bal >= 0, f"CRITICAL: Negative balance! {bal}"
            assert bal == 0, f"Expected 0, got {bal} (ok={ok})"
            assert ok == 20, f"Expected 20 ok, got {ok}"
            assert nsf == 30, f"Expected 30 nsf, got {nsf}"
            assert not errs, f"Errors: {errs}"

    @pytest.mark.asyncio
    async def test_concurrent_debits_varying_amounts(self):
        """100 random debits against 5000 balance."""
        import random
        async with fresh_db() as sf:
            org, _, w = await new_org(sf, 5_000)
            amounts = [random.choice([100, 200, 300, 500, 1000]) for _ in range(100)]

            async def debit(i):
                async with sf() as s:
                    try:
                        await debit_wallet(s, org.id, amounts[i], f"v-{i}", f"v{i}-{w.id}")
                        await s.commit()
                        return ("ok", amounts[i])
                    except InsufficientBalanceError:
                        await s.rollback()
                        return ("nsf", 0)
                    except Exception as e:
                        await s.rollback()
                        return (f"err:{e}", 0)

            results = await bounded_gather([debit(i) for i in range(100)])
            total = sum(a for st, a in results if st == "ok")

            async with sf() as s:
                bal = await get_wallet_balance(s, org.id)

            assert bal >= 0, f"CRITICAL: Negative! {bal}"
            assert bal == 5_000 - total

    @pytest.mark.asyncio
    async def test_concurrent_credits_and_debits(self):
        """Mixed ops -- balance consistent."""
        async with fresh_db() as sf:
            org, _, w = await new_org(sf, 5_000)

            async def credit(i):
                async with sf() as s:
                    try:
                        await credit_wallet(s, org.id, 100, f"c-{i}", idempotency_key=f"c{i}-{w.id}")
                        await s.commit()
                        return 100
                    except Exception:
                        await s.rollback()
                        return 0

            async def debit(i):
                async with sf() as s:
                    try:
                        await debit_wallet(s, org.id, 100, f"d-{i}", f"md{i}-{w.id}")
                        await s.commit()
                        return -100
                    except InsufficientBalanceError:
                        await s.rollback()
                        return 0
                    except Exception:
                        await s.rollback()
                        return 0

            tasks = []
            for i in range(20):
                tasks += [credit(i), debit(i)]
            results = await bounded_gather(tasks)
            net = sum(results)

            async with sf() as s:
                bal = await get_wallet_balance(s, org.id)

            assert bal >= 0
            assert bal == 5_000 + net


# ===========================================================================
# 2. CONCURRENT API KEY CREATION
# ===========================================================================


class TestConcurrentKeyCreation:

    @pytest.mark.asyncio
    async def test_20_concurrent_key_creates(self):
        """20 simultaneous key creates -- all unique."""
        async with fresh_db() as sf:
            org, prof, _ = await new_org(sf)
            tok = make_jwt(prof)

            async def create_key(c, i):
                try:
                    return await c.post(
                        "/v1/keys",
                        json={"name": f"k-{i}", "environment": "test"},
                        cookies={"mazou_session": tok},
                    )
                except Exception:
                    return None

            async with app_client() as c:
                resps = await asyncio.gather(*[create_key(c, i) for i in range(20)])

            ok = [r for r in resps if r is not None and r.status_code == 200]
            assert len(ok) >= 15, (
                f"Got {len(ok)}. "
                f"Fails: {[(r.status_code, r.text[:80]) for r in resps if r is not None and r.status_code != 200]}, "
                f"Errors: {sum(1 for r in resps if r is None)}"
            )
            keys = [r.json()["key"] for r in ok]
            assert len(set(keys)) == len(ok), "Duplicate keys generated!"


# ===========================================================================
# 3. CONCURRENT SIGNUPS
# ===========================================================================


class TestConcurrentSignups:

    @pytest.mark.asyncio
    async def test_10_simultaneous_signups(self):
        """10 unique emails -- all succeed."""
        async with fresh_db() as sf:

            async def signup(c, i):
                try:
                    return await c.post("/api/auth/signup", json={
                        "email": f"su{i}-{uuid.uuid4().hex[:6]}@t.com",
                        "password": "password123456",
                        "full_name": f"U{i}",
                        "org_name": f"O{i}-{uuid.uuid4().hex[:6]}",
                    })
                except Exception:
                    return None  # Connection error under NullPool load

            async with app_client() as c:
                resps = await asyncio.gather(*[signup(c, i) for i in range(10)])

            ok = [r for r in resps if r is not None and r.status_code == 200]
            failed = [r for r in resps if r is not None and r.status_code != 200]
            errs = [r for r in resps if r is None]
            assert len(ok) >= 8, (
                f"Got {len(ok)} ok, {len(failed)} failed, {len(errs)} errors. "
                f"Fails: {[(r.status_code, r.text[:80]) for r in failed]}"
            )
            oids = [r.json()["user"]["org_id"] for r in ok]
            assert len(set(oids)) == len(ok), "Duplicate org IDs!"

    @pytest.mark.asyncio
    async def test_duplicate_email_rejected(self):
        """Register email, then blast 5 concurrent duplicates -- all should fail.

        The signup endpoint checks email uniqueness via SELECT, but the DB
        also has a UNIQUE constraint on profiles.email as a safety net.
        After registering once, all subsequent attempts should get 400
        (app-level check) or 500 (DB constraint violation).
        """
        async with fresh_db() as sf:
            email = f"dup-{uuid.uuid4().hex[:8]}@t.com"

            # Register the email first (sequentially, guaranteed to work)
            async with app_client() as c:
                first = await c.post("/api/auth/signup", json={
                    "email": email, "password": "password123456",
                    "full_name": "First",
                    "org_name": f"DO-first-{uuid.uuid4().hex[:6]}",
                })
                assert first.status_code == 200, (
                    f"Initial signup failed: {first.status_code} {first.text[:80]}"
                )

            # Now blast 5 concurrent duplicates -- none should succeed
            async def try_dup(c, i):
                try:
                    r = await c.post("/api/auth/signup", json={
                        "email": email, "password": "password123456",
                        "full_name": f"D{i}",
                        "org_name": f"DO{i}-{uuid.uuid4().hex[:6]}",
                    })
                    return r.status_code
                except Exception:
                    return 500

            async with app_client() as c:
                statuses = await asyncio.gather(*[
                    try_dup(c, i) for i in range(5)
                ])

            ok_count = statuses.count(200)
            assert ok_count == 0, (
                f"{ok_count} duplicate signups succeeded! "
                f"Email should already be taken. Statuses: {statuses}"
            )


# ===========================================================================
# 4. RATE LIMITER
# ===========================================================================


class TestRateLimiter:

    @pytest.mark.asyncio
    async def test_rate_limit_kicks_in(self):
        cache = MemoryCache()
        results = []
        for _ in range(20):
            n = await cache.incr_sliding_window("rl:t", 60)
            results.append(200 if n <= 10 else 429)
        assert results.count(200) == 10
        assert results.count(429) == 10

    @pytest.mark.asyncio
    async def test_sliding_window_concurrent(self):
        cache = MemoryCache()
        results = await asyncio.gather(*[
            cache.incr_sliding_window("rl:cc", 60) for _ in range(100)
        ])
        assert max(results) == 100


# ===========================================================================
# 5. CONCURRENT WEBHOOKS
# ===========================================================================


class TestConcurrentWebhooks:

    @pytest.mark.asyncio
    async def test_duplicate_webhook_credits_once(self):
        """10 identical webhooks -- wallet credited exactly once."""
        async with fresh_db() as sf:
            org, _, w = await new_org(sf, 1_000)

            ref = f"ref_{uuid.uuid4().hex[:12]}"
            amt = 50_000
            body = json.dumps({
                "event": "charge.success",
                "data": {"reference": ref, "amount": amt, "metadata": {"org_id": org.id}},
            }).encode()

            from backend.shared.config import settings
            sig = hmac.new(settings.paystack_secret_key.encode(), body, hashlib.sha512).hexdigest()
            mock = AsyncMock(return_value={"status": "success", "amount": amt})

            async with app_client() as c:
                async def send(i):
                    with patch("backend.gateway.routers.webhooks.verify_transaction", mock), \
                         patch("backend.gateway.routers.webhooks.AsyncSessionLocal", sf):
                        return await c.post("/webhooks/paystack", content=body, headers={
                            "x-paystack-signature": sig, "content-type": "application/json",
                        })
                resps = await asyncio.gather(*[send(i) for i in range(10)])

            async with sf() as s:
                bal = await get_wallet_balance(s, org.id)

            assert bal == 51_000, (
                f"Expected 51000, got {bal}. "
                f"200s={sum(1 for r in resps if r.status_code==200)}, "
                f"500s={sum(1 for r in resps if r.status_code>=500)}"
            )


# ===========================================================================
# 6. CONNECTION POOL EXHAUSTION
# ===========================================================================


class TestConnectionPoolExhaustion:

    @pytest.mark.asyncio
    async def test_100_concurrent_requests(self):
        """At least 90% succeed under load (NullPool may drop a few connections)."""
        async with fresh_db() as sf:
            org, prof, _ = await new_org(sf)
            tok = make_jwt(prof)
            eps = [("/health", {}), ("/v1/keys", {"cookies": {"mazou_session": tok}}),
                   ("/api/auth/me", {"cookies": {"mazou_session": tok}})]

            async with app_client() as c:
                async def hit(i):
                    url, kw = eps[i % len(eps)]
                    try:
                        return (await c.get(url, **kw)).status_code
                    except Exception as e:
                        return f"err:{e}"
                results = await asyncio.gather(*[hit(i) for i in range(100)])

            ok = [r for r in results if isinstance(r, int) and r < 500]
            errs = [r for r in results if isinstance(r, str)]
            s500 = [r for r in results if isinstance(r, int) and r >= 500]
            total_failures = len(errs) + len(s500)
            assert total_failures <= 10, (
                f"{total_failures} failures out of 100 requests "
                f"({len(errs)} connection errors, {len(s500)} server errors)"
            )

    @pytest.mark.asyncio
    async def test_200_health_checks(self):
        async with app_client() as c:
            results = await asyncio.gather(*[c.get("/health") for _ in range(200)])
        assert all(r.status_code == 200 for r in results)


# ===========================================================================
# 7. WALLET IDEMPOTENCY
# ===========================================================================


class TestWalletIdempotency:

    @pytest.mark.asyncio
    async def test_idempotency_prevents_double_debit(self):
        async with fresh_db() as sf:
            org, _, _ = await new_org(sf, 10_000)
            key = f"idem-{uuid.uuid4().hex[:8]}"

            async with sf() as s:
                await debit_wallet(s, org.id, 1_000, "first", key)
                await s.commit()

            async with sf() as s:
                with pytest.raises(DuplicateTransactionError):
                    await debit_wallet(s, org.id, 1_000, "dup", key)

            async with sf() as s:
                assert await get_wallet_balance(s, org.id) == 9_000

    @pytest.mark.asyncio
    async def test_concurrent_same_idempotency_key(self):
        """At most 1 debit with same key."""
        async with fresh_db() as sf:
            org, _, _ = await new_org(sf, 10_000)
            key = f"ri-{uuid.uuid4().hex[:8]}"

            async def attempt(i):
                async with sf() as s:
                    try:
                        await debit_wallet(s, org.id, 1_000, f"r-{i}", key)
                        await s.commit()
                        return "ok"
                    except DuplicateTransactionError:
                        await s.rollback()
                        return "dup"
                    except Exception as e:
                        await s.rollback()
                        return f"err:{e}"

            results = await bounded_gather([attempt(i) for i in range(10)])

            async with sf() as s:
                bal = await get_wallet_balance(s, org.id)
            assert bal >= 9_000, f"Double debit! bal={bal}"
