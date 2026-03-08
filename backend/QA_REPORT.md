# Mazou Backend — QA Report

> **Living document** — updated after each QA cycle.

---

## QA Cycle #1 — 2026-03-01

### Test Suites Run

| Suite | Tests | Passed | Failed | Duration |
|-------|-------|--------|--------|----------|
| QA Functional | 99 | 99 | 0 | ~110s |
| Stress Tests | 13 | 13 | 0 | ~78s |
| Performance Benchmarks | 16 | 16 | 0 | ~78s |
| Security Tests | 70 | 70 | 0 | ~19s |
| **Total** | **198** | **198** | **0** | |

### Vulnerabilities Found

| # | Severity | Issue | File | Status |
|---|----------|-------|------|--------|
| 1 | **MEDIUM** | Wallet topup leaks raw exception messages to client | `gateway/routers/wallet.py:96` | FIXED |
| 2 | **MEDIUM** | Signup says "Email already registered" (user enumeration) | `gateway/routers/auth.py:34` | FIXED |
| 3 | **MEDIUM** | Session cookie missing `Secure` flag for production | `gateway/routers/auth.py:61,100` | FIXED |
| 4 | **LOW** | Default secret key accepted silently in production | `shared/config.py:16` | FIXED |
| 5 | **LOW** | No validation on routing rule `status` field | `shared/schemas.py:197` | FIXED |
| 6 | **LOW** | No HTML sanitization on stored text fields | Multiple routers | DEFERRED (frontend responsibility) |

### Bugs Found

| # | Source | Issue | File | Status |
|---|--------|-------|------|--------|
| 1 | Stress | Duplicate email signup returns 500 instead of 409 (missing IntegrityError catch) | `gateway/routers/auth.py` | FIXED |
| 2 | QA | `async with` double-closing DB sessions causing hangs | `tests/conftest.py` | FIXED (test-only) |
| 3 | QA | Windows ProactorEventLoop crash with asyncpg | `tests/conftest.py` | FIXED (test-only) |
| 4 | QA | Event loop scope mismatch between test files | All test files | FIXED (test-only) |
| 5 | QA | `app.state.cache` not initialized in test env | `tests/conftest.py` | FIXED (test-only) |
| 6 | QA | Wrong mock path for Paystack `initialize_transaction` | `tests/test_wallet.py` | FIXED (test-only) |
| 7 | QA | Orphaned PostgreSQL connections from crashed test runs | `tests/conftest.py` | FIXED (test-only) |

### Stress Test Results

| Test | Result |
|------|--------|
| 50 concurrent wallet debits (500 kobo each, 10K balance) | 20 succeed, 30 fail, balance = 0. Never negative. |
| 10 identical Paystack webhooks simultaneously | Wallet credited exactly once (idempotency works) |
| 20 concurrent API key creates | All unique, no collisions |
| 10 simultaneous signups | All succeed with unique orgs |
| Rate limiter (100 rapid requests) | Correctly returns 429 after limit |
| 100 concurrent mixed requests | <10% failure rate, no crashes |

### Security Positive Findings

- JWT auth correctly rejects tampering, `none` algorithm, expired tokens
- Cross-org isolation enforced on all queries (filter by org_id)
- SQL injection impossible (SQLAlchemy parameterized queries)
- Wallet atomicity holds under concurrent load
- Webhook HMAC-SHA512 verification with timing-safe comparison
- API key hashing with SHA-256 (raw keys never stored)
- Rate limiting per API key (not spoofable via X-Forwarded-For)
- Login doesn't enumerate users (same error for wrong email vs wrong password)
- Idempotency keys prevent double wallet credits

### Performance Benchmarks

| Endpoint Category | p50 | p95 | p99 |
|-------------------|-----|-----|-----|
| Health check | <5ms | <10ms | <15ms |
| GET /v1/models | <15ms | <30ms | <50ms |
| GET /api/auth/me | <10ms | <20ms | <35ms |
| GET /api/dashboard/stats | <25ms | <50ms | <80ms |
| POST /api/auth/signup | ~200ms | ~300ms | ~400ms (bcrypt-dominated) |
| POST /api/auth/login | ~200ms | ~300ms | ~400ms (bcrypt-dominated) |

---

## How to Run Tests

```bash
# From project root (c:\Users\awulu\Documents\Main Development Projects\mazou)

# QA Functional (99 tests)
PYTHONPATH=. python -m pytest backend/tests/test_auth.py backend/tests/test_keys.py backend/tests/test_wallet.py backend/tests/test_completions.py backend/tests/test_models.py backend/tests/test_dashboard.py backend/tests/test_usage.py backend/tests/test_routing.py backend/tests/test_webhooks.py -v --tb=short

# Stress Tests (13 tests)
PYTHONPATH=. python -m pytest backend/tests/stress/test_stress.py -v --tb=short --noconftest -p pytest_asyncio -o "asyncio_mode=auto" -o "asyncio_default_fixture_loop_scope=session"

# Performance Benchmarks (16 tests)
PYTHONPATH=. python -m pytest backend/tests/test_performance.py -v -s --tb=short

# Security Tests (70 tests)
PYTHONPATH=. python -m pytest backend/tests/test_security.py -v --tb=short

# ALL (excluding stress — requires --noconftest)
PYTHONPATH=. python -m pytest backend/tests/ -v --tb=short --ignore=backend/tests/stress
```

---

## QA Cycle #1.1 (Regression) — 2026-03-01

**Trigger**: Fixes applied for all MEDIUM/LOW vulnerabilities and bugs from Cycle #1.

### Fixes Applied

| # | Fix | File Changed |
|---|-----|-------------|
| 1 | Wallet topup now returns generic error, no exception leakage | `gateway/routers/wallet.py` |
| 2 | Signup returns 409 with generic message (no user enumeration) | `gateway/routers/auth.py` |
| 3 | IntegrityError catch for race condition on duplicate email | `gateway/routers/auth.py` |
| 4 | Session cookie gets `secure=True` when not on SQLite | `gateway/routers/auth.py` |
| 5 | Default secret key emits warning at startup | `shared/config.py` |
| 6 | Routing rule `status` validated to `active|paused` only | `shared/schemas.py` |

### Regression Results

| Suite | Tests | Passed | Failed | Test Fixes |
|-------|-------|--------|--------|------------|
| QA Functional | 99 | 99 | 0 | 1 (409 status) |
| Security | 70 | 70 | 0 | 2 (409 status + generic msg) |
| Stress | 13 | 13 | 0 | 0 |
| **Total** | **182** | **182** | **0** | **3** |

Performance suite not re-run (no perf-relevant changes).

### Open Items

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | **LOW** | No HTML sanitization on stored text fields | DEFERRED (frontend responsibility) |
| 2 | **INFO** | 367 `datetime.utcnow()` deprecation warnings (Python 3.12+) | Future cleanup |

---

*Next QA cycle: run after next batch of changes.*
