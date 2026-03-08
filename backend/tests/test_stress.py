"""
Stress tests for Mazou backend: concurrency, race conditions, system limits.

Tests run against a real PostgreSQL database to catch real concurrency bugs
that in-memory/SQLite won't expose.

Run: PYTHONPATH=. python -m pytest backend/tests/test_stress.py -v --tb=short

These tests are self-contained: they create their own engine and session
factory per test, so they don't conflict with conftest.py fixtures.
"""

from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
import os
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.shared.models import (
    ApiKey,
    Base,
    Organization,
    Profile,
    Wallet,
    WalletTransaction,
)
from backend.billing.wallet import (
    InsufficientBalanceError,
    DuplicateTransactionError,
    credit_wallet,
    debit_wallet,
    get_wallet_balance,
)
from backend.gateway.middleware.auth import create_access_token, hash_password
from backend.shared.cache import MemoryCache

# ---------------------------------------------------------------------------
# Database URL
# ---------------------------------------------------------------------------

DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/mazou",
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _new_engine():
    return create_async_engine(DB_URL, echo=False, pool_size=20, max_overflow=30)


def _new_session_factory(engine):
    return async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def _setup_tables(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _create_test_org(
    sf, balance_kobo: int = 0
) -> tuple[Organization, Profile, Wallet]:
    async with sf() as db:
        org = Organization(name="Stress Org", slug=f"stress-{uuid.uuid4().hex[:8]}")
        db.add(org)
        await db.flush()
        profile = Profile(
            org_id=org.id,
            email=f"stress-{uuid.uuid4().hex[:6]}@test.com",
            password=hash_password("testpassword123"),
            full_name="Stress Tester",
            role="owner",
        )
        db.add(profile)
        wallet = Wallet(org_id=org.id, currency="NGN", balance_kobo=balance_kobo)
        db.add(wallet)
        await db.commit()
        await db.refresh(org)
        await db.refresh(profile)
        await db.refresh(wallet)
        return org, profile, wallet


def _jwt(profile: Profile) -> str:
    return create_access_token(profile.id, profile.org_id)


def _patch_db(engine, sf):
    """Monkey-patch the shared database module to use our engine/session."""
    import backend.shared.database as db_mod
    old_engine, old_sf = db_mod.engine, db_mod.AsyncSessionLocal
    db_mod.engine = engine
    db_mod.AsyncSessionLocal = sf
    return old_engine, old_sf


def _restore_db(old_engine, old_sf):
    import backend.shared.database as db_mod
    db_mod.engine = old_engine
    db_mod.AsyncSessionLocal = old_sf


# ===========================================================================
# 1. WALLET RACE CONDITIONS (CRITICAL)
# ===========================================================================


class TestWalletRaceConditions:

    @pytest.mark.asyncio
    async def test_concurrent_debits_never_go_negative(self):
        """
        Balance = 10,000 kobo. 50 concurrent debits of 500 kobo each.
        Only 20 should succeed. Final balance = 0.
        """
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)

        try:
            org, profile, wallet = await _create_test_org(sf, balance_kobo=10_000)

            async def attempt_debit(i: int) -> str:
                async with sf() as session:
                    try:
                        await debit_wallet(
                            db=session, org_id=org.id, amount_kobo=500,
                            description=f"stress-debit-{i}",
                            idempotency_key=f"stress-debit-{i}-{wallet.id}",
                        )
                        await session.commit()
                        return "success"
                    except InsufficientBalanceError:
                        await session.rollback()
                        return "insufficient"
                    except Exception as e:
                        await session.rollback()
                        return f"error:{e}"

            results = await asyncio.gather(*[attempt_debit(i) for i in range(50)])

            successes = results.count("success")
            insufficients = results.count("insufficient")
            errors = [r for r in results if isinstance(r, str) and r.startswith("error:")]

            async with sf() as session:
                final_balance = await get_wallet_balance(session, org.id)

            assert final_balance >= 0, f"CRITICAL: Balance went negative! balance={final_balance}"
            assert final_balance == 0, f"Expected balance=0, got {final_balance} (successes={successes})"
            assert successes == 20, f"Expected 20 successful debits, got {successes}"
            assert insufficients == 30, f"Expected 30 insufficient, got {insufficients}"
            assert len(errors) == 0, f"Unexpected errors: {errors}"
        finally:
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_concurrent_debits_varying_amounts(self):
        """
        Balance = 5,000 kobo. 100 concurrent debits of random amounts.
        Final balance must be >= 0 and arithmetically correct.
        """
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)

        try:
            org, _, wallet = await _create_test_org(sf, balance_kobo=5_000)

            import random
            amounts = [random.choice([100, 200, 300, 500, 1000]) for _ in range(100)]

            async def attempt(i: int) -> tuple[str, int]:
                async with sf() as session:
                    try:
                        await debit_wallet(
                            db=session, org_id=org.id, amount_kobo=amounts[i],
                            description=f"vary-{i}",
                            idempotency_key=f"vary-{i}-{wallet.id}",
                        )
                        await session.commit()
                        return ("success", amounts[i])
                    except InsufficientBalanceError:
                        await session.rollback()
                        return ("insufficient", 0)
                    except Exception as e:
                        await session.rollback()
                        return (f"error:{e}", 0)

            results = await asyncio.gather(*[attempt(i) for i in range(100)])
            total_debited = sum(a for s, a in results if s == "success")

            async with sf() as session:
                final = await get_wallet_balance(session, org.id)

            assert final >= 0, f"CRITICAL: Balance went negative! balance={final}"
            assert final == 5_000 - total_debited, (
                f"Balance mismatch: expected {5_000 - total_debited}, got {final}"
            )
        finally:
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_concurrent_credits_and_debits(self):
        """Mixed credits and debits -- final balance must be consistent."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)

        try:
            org, _, wallet = await _create_test_org(sf, balance_kobo=5_000)

            async def do_credit(i: int) -> int:
                async with sf() as session:
                    try:
                        await credit_wallet(
                            db=session, org_id=org.id, amount_kobo=100,
                            description=f"credit-{i}",
                            idempotency_key=f"credit-{i}-{wallet.id}",
                        )
                        await session.commit()
                        return 100
                    except Exception:
                        await session.rollback()
                        return 0

            async def do_debit(i: int) -> int:
                async with sf() as session:
                    try:
                        await debit_wallet(
                            db=session, org_id=org.id, amount_kobo=100,
                            description=f"debit-{i}",
                            idempotency_key=f"mixed-debit-{i}-{wallet.id}",
                        )
                        await session.commit()
                        return -100
                    except InsufficientBalanceError:
                        await session.rollback()
                        return 0
                    except Exception:
                        await session.rollback()
                        return 0

            tasks = []
            for i in range(20):
                tasks.append(do_credit(i))
                tasks.append(do_debit(i))

            results = await asyncio.gather(*tasks)
            net = sum(results)

            async with sf() as session:
                final = await get_wallet_balance(session, org.id)

            assert final >= 0, f"CRITICAL: Balance went negative! balance={final}"
            assert final == 5_000 + net, f"Mismatch: expected {5_000 + net}, got {final}"
        finally:
            await engine.dispose()


# ===========================================================================
# 2. CONCURRENT API KEY CREATION
# ===========================================================================


class TestConcurrentKeyCreation:

    @pytest.mark.asyncio
    async def test_20_concurrent_key_creates(self):
        """Create 20 API keys simultaneously -- all unique, no collisions."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)
        old = _patch_db(engine, sf)

        try:
            org, profile, _ = await _create_test_org(sf)
            token = _jwt(profile)

            from backend.gateway.main import app
            transport = ASGITransport(app=app)

            async with AsyncClient(transport=transport, base_url="http://test") as client:
                async def create_key(i: int):
                    return await client.post(
                        "/v1/keys",
                        json={"name": f"stress-key-{i}", "environment": "test"},
                        cookies={"mazou_session": token},
                    )

                responses = await asyncio.gather(*[create_key(i) for i in range(20)])

            successes = [r for r in responses if r.status_code == 200]
            assert len(successes) == 20, (
                f"Expected 20 key creations, got {len(successes)}. "
                f"Failures: {[(r.status_code, r.text) for r in responses if r.status_code != 200]}"
            )

            keys = [r.json()["key"] for r in successes]
            assert len(set(keys)) == 20, "Key collision detected!"
        finally:
            _restore_db(*old)
            await engine.dispose()


# ===========================================================================
# 3. CONCURRENT SIGNUPS
# ===========================================================================


class TestConcurrentSignups:

    @pytest.mark.asyncio
    async def test_10_simultaneous_signups(self):
        """10 concurrent signups with unique emails -- all should succeed."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)
        old = _patch_db(engine, sf)

        try:
            from backend.gateway.main import app
            transport = ASGITransport(app=app)

            async with AsyncClient(transport=transport, base_url="http://test") as client:
                async def signup(i: int):
                    return await client.post(
                        "/api/auth/signup",
                        json={
                            "email": f"stress{i}-{uuid.uuid4().hex[:6]}@test.com",
                            "password": "password123456",
                            "full_name": f"Stress User {i}",
                            "org_name": f"Stress Org {i} {uuid.uuid4().hex[:6]}",
                        },
                    )

                responses = await asyncio.gather(*[signup(i) for i in range(10)])

            successes = [r for r in responses if r.status_code == 200]
            assert len(successes) == 10, (
                f"Expected 10 signups, got {len(successes)}. "
                f"Failures: {[(r.status_code, r.text) for r in responses if r.status_code != 200]}"
            )

            org_ids = [r.json()["user"]["org_id"] for r in successes]
            assert len(set(org_ids)) == 10, "Org collision detected!"

            async with sf() as session:
                for oid in org_ids:
                    result = await session.execute(
                        select(Wallet).where(Wallet.org_id == oid)
                    )
                    w = result.scalar_one_or_none()
                    assert w is not None, f"No wallet for org {oid}"
                    assert w.balance_kobo == 0
        finally:
            _restore_db(*old)
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_duplicate_email_signup_rejected(self):
        """Concurrent signups with same email -- only one should succeed."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)
        old = _patch_db(engine, sf)

        try:
            from backend.gateway.main import app
            transport = ASGITransport(app=app)
            email = f"dup-{uuid.uuid4().hex[:8]}@test.com"

            async with AsyncClient(transport=transport, base_url="http://test") as client:
                async def signup(i: int):
                    return await client.post(
                        "/api/auth/signup",
                        json={
                            "email": email,
                            "password": "password123456",
                            "full_name": f"Dup User {i}",
                            "org_name": f"Dup Org {i} {uuid.uuid4().hex[:6]}",
                        },
                    )

                responses = await asyncio.gather(*[signup(i) for i in range(5)])

            successes = [r for r in responses if r.status_code == 200]
            assert len(successes) >= 1, "No signup succeeded"
            assert len(successes) <= 1, (
                f"Multiple signups with same email succeeded ({len(successes)})! "
                f"Race condition: check-then-insert without proper constraint."
            )
        finally:
            _restore_db(*old)
            await engine.dispose()


# ===========================================================================
# 4. RATE LIMITER UNDER LOAD
# ===========================================================================


class TestRateLimiter:

    @pytest.mark.asyncio
    async def test_rate_limit_kicks_in(self):
        """
        Directly test the cache-based sliding window rate limiter.
        With limit=10, 20 requests should yield 10 allowed + 10 blocked.
        """
        cache = MemoryCache()

        results = []
        for _ in range(20):
            count = await cache.incr_sliding_window("rl:test-key", 60)
            results.append(200 if count <= 10 else 429)

        assert results.count(200) == 10, f"Expected 10 allowed, got {results.count(200)}"
        assert results.count(429) == 10, f"Expected 10 blocked, got {results.count(429)}"

    @pytest.mark.asyncio
    async def test_sliding_window_concurrent(self):
        """Concurrent increments should all be counted correctly."""
        cache = MemoryCache()

        async def incr(i: int):
            return await cache.incr_sliding_window("rl:concurrent", 60)

        results = await asyncio.gather(*[incr(i) for i in range(100)])
        assert max(results) == 100
        assert min(results) >= 1


# ===========================================================================
# 5. CONCURRENT WEBHOOK PROCESSING (Idempotency)
# ===========================================================================


class TestConcurrentWebhooks:

    @pytest.mark.asyncio
    async def test_duplicate_webhook_credits_once(self):
        """
        10 identical Paystack webhooks (same reference) arrive simultaneously.
        Only ONE should credit the wallet.
        """
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)
        old = _patch_db(engine, sf)

        try:
            org, _, wallet = await _create_test_org(sf, balance_kobo=1_000)

            reference = f"ref_{uuid.uuid4().hex[:12]}"
            amount_kobo = 50_000

            webhook_body = json.dumps({
                "event": "charge.success",
                "data": {
                    "reference": reference,
                    "amount": amount_kobo,
                    "metadata": {"org_id": org.id},
                },
            }).encode()

            from backend.shared.config import settings
            signature = hmac.new(
                settings.paystack_secret_key.encode(),
                webhook_body, hashlib.sha512,
            ).hexdigest()

            mock_verify = AsyncMock(return_value={"status": "success", "amount": amount_kobo})

            from backend.gateway.main import app
            transport = ASGITransport(app=app)

            # Also patch AsyncSessionLocal in the webhooks module since it
            # imports it by name (from backend.shared.database import AsyncSessionLocal)
            async with AsyncClient(transport=transport, base_url="http://test") as client:
                async def send(i: int):
                    with patch("backend.gateway.routers.webhooks.verify_transaction", mock_verify), \
                         patch("backend.gateway.routers.webhooks.AsyncSessionLocal", sf):
                        return await client.post(
                            "/webhooks/paystack",
                            content=webhook_body,
                            headers={
                                "x-paystack-signature": signature,
                                "content-type": "application/json",
                            },
                        )

                responses = await asyncio.gather(*[send(i) for i in range(10)])

            # Tally results
            ok = [r for r in responses if r.status_code == 200]
            credited = [r for r in ok if r.json().get("message") == "Wallet credited"]
            already = [r for r in ok if r.json().get("message") == "Already processed"]
            errors = [r for r in responses if r.status_code >= 500]

            # Critical: wallet credited exactly once
            async with sf() as session:
                final = await get_wallet_balance(session, org.id)

            assert final == 51_000, (
                f"Expected 51000, got {final}. "
                f"credited={len(credited)}, already={len(already)}, errors={len(errors)}"
            )
        finally:
            _restore_db(*old)
            await engine.dispose()


# ===========================================================================
# 6. DATABASE CONNECTION POOL EXHAUSTION
# ===========================================================================


class TestConnectionPoolExhaustion:

    @pytest.mark.asyncio
    async def test_100_concurrent_requests(self):
        """100 concurrent requests -- no 500s from pool exhaustion."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)
        old = _patch_db(engine, sf)

        try:
            org, profile, _ = await _create_test_org(sf)
            token = _jwt(profile)

            from backend.gateway.main import app
            transport = ASGITransport(app=app)

            async with AsyncClient(transport=transport, base_url="http://test") as client:
                endpoints = [
                    ("GET", "/health", {}),
                    ("GET", "/v1/keys", {"cookies": {"mazou_session": token}}),
                    ("GET", "/api/auth/me", {"cookies": {"mazou_session": token}}),
                ]

                async def hit(i: int):
                    _, url, kw = endpoints[i % len(endpoints)]
                    try:
                        r = await client.get(url, **kw)
                        return r.status_code
                    except Exception as e:
                        return f"error:{e}"

                results = await asyncio.gather(*[hit(i) for i in range(100)])

            errors = [r for r in results if isinstance(r, str)]
            server_errs = [r for r in results if isinstance(r, int) and r >= 500]

            assert len(errors) == 0, f"Connection errors: {errors[:5]}"
            assert len(server_errs) == 0, (
                f"{len(server_errs)} server errors -- possible pool exhaustion"
            )
        finally:
            _restore_db(*old)
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_200_health_checks(self):
        """200 rapid health checks -- all should return 200."""
        from backend.gateway.main import app
        transport = ASGITransport(app=app)

        async with AsyncClient(transport=transport, base_url="http://test") as client:
            results = await asyncio.gather(*[
                client.get("/health") for _ in range(200)
            ])

        assert all(r.status_code == 200 for r in results)


# ===========================================================================
# 7. WALLET IDEMPOTENCY
# ===========================================================================


class TestWalletIdempotency:

    @pytest.mark.asyncio
    async def test_idempotency_prevents_double_debit(self):
        """Same idempotency key prevents duplicate debits."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)

        try:
            org, _, wallet = await _create_test_org(sf, balance_kobo=10_000)
            idem = f"idem-{uuid.uuid4().hex[:8]}"

            async with sf() as session:
                await debit_wallet(
                    db=session, org_id=org.id, amount_kobo=1_000,
                    description="first", idempotency_key=idem,
                )
                await session.commit()

            async with sf() as session:
                with pytest.raises(DuplicateTransactionError):
                    await debit_wallet(
                        db=session, org_id=org.id, amount_kobo=1_000,
                        description="dup", idempotency_key=idem,
                    )

            async with sf() as session:
                balance = await get_wallet_balance(session, org.id)
            assert balance == 9_000
        finally:
            await engine.dispose()

    @pytest.mark.asyncio
    async def test_concurrent_same_idempotency_key(self):
        """Concurrent debits with same idempotency key -- at most 1 succeeds."""
        engine = _new_engine()
        sf = _new_session_factory(engine)
        await _setup_tables(engine)

        try:
            org, _, wallet = await _create_test_org(sf, balance_kobo=10_000)
            idem = f"race-idem-{uuid.uuid4().hex[:8]}"

            async def attempt(i: int) -> str:
                async with sf() as session:
                    try:
                        await debit_wallet(
                            db=session, org_id=org.id, amount_kobo=1_000,
                            description=f"race-{i}", idempotency_key=idem,
                        )
                        await session.commit()
                        return "success"
                    except DuplicateTransactionError:
                        await session.rollback()
                        return "duplicate"
                    except Exception as e:
                        await session.rollback()
                        return f"error:{e}"

            results = await asyncio.gather(*[attempt(i) for i in range(10)])
            successes = results.count("success")

            async with sf() as session:
                balance = await get_wallet_balance(session, org.id)

            assert balance >= 9_000, (
                f"More than 1 debit went through! balance={balance}, successes={successes}"
            )
        finally:
            await engine.dispose()
