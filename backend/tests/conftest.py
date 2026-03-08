"""
Shared test fixtures for Mazou backend QA tests.

Uses pytest-asyncio + httpx.AsyncClient with ASGITransport.
All tests run against real PostgreSQL + Redis.

Design:
- NullPool to avoid asyncpg event-loop affinity issues
- Tables are created once (create_all is idempotent) and never dropped
- Data cleanup uses TRUNCATE at session start (one-time, no per-test cleanup)
- Each test uses UUID-unique data for isolation
"""

import asyncio
import hashlib
import secrets
import sys
import uuid

# MUST set event loop policy before any async engine/connection creation
# to avoid ProactorEventLoop transport corruption on Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool

import backend.shared.database as db_module
from backend.shared.config import settings
from backend.shared.database import Base, get_db
from backend.shared.models import (
    Agent,
    ApiKey,
    Organization,
    Profile,
    Recommendation,
    RoutingRule,
    UsageLog,
    Wallet,
    WalletTransaction,
)
from backend.gateway.middleware.auth import create_access_token, hash_password
from backend.shared.cache import MemoryCache
from backend.gateway.main import app


# ---------------------------------------------------------------------------
# Test engine (NullPool: each checkout creates a fresh connection)
# ---------------------------------------------------------------------------

_test_engine = create_async_engine(
    settings.database_url,
    echo=False,
    poolclass=NullPool,
)

_test_session_factory = async_sessionmaker(
    _test_engine, class_=AsyncSession, expire_on_commit=False,
)

# Monkey-patch so all code uses the test engine
db_module.engine = _test_engine
db_module.AsyncSessionLocal = _test_session_factory

# Override FastAPI get_db
async def _test_get_db():
    session = _test_session_factory()
    try:
        yield session
    finally:
        await session.close()

app.dependency_overrides[get_db] = _test_get_db


# ---------------------------------------------------------------------------
# Tables to clean
# ---------------------------------------------------------------------------

TABLES_TO_CLEAN = [
    "wallet_transactions",
    "usage_logs",
    "routing_rules",
    "recommendations",
    "agents",
    "api_keys",
    "byok_keys",
    "wallets",
    "invoices",
    "profiles",
    "organizations",
]


# ---------------------------------------------------------------------------
# Session setup: create tables, clean data
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    # Initialize cache (lifespan doesn't run under ASGITransport)
    # Use MemoryCache to avoid Redis connection lifecycle issues in tests
    app.state.cache = MemoryCache()

    # Kill any orphaned connections from previous test runs
    async with _test_engine.begin() as conn:
        await conn.execute(text("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = current_database()
              AND pid != pg_backend_pid()
              AND state != 'idle'
        """))

    # Create tables (idempotent)
    async with _test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Clean all data at session start (use TRUNCATE CASCADE for speed)
    async with _test_session_factory() as session:
        tables_csv = ", ".join(f'"{t}"' for t in TABLES_TO_CLEAN)
        try:
            await session.execute(text(f"TRUNCATE TABLE {tables_csv} CASCADE"))
            await session.commit()
        except Exception:
            await session.rollback()

    yield
    # Do NOT drop tables — just dispose the engine
    await _test_engine.dispose()


# ---------------------------------------------------------------------------
# DB session fixture
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def db() -> AsyncSession:
    async with _test_session_factory() as session:
        yield session


# ---------------------------------------------------------------------------
# Unique ID for test isolation
# ---------------------------------------------------------------------------

def _unique_suffix() -> str:
    return uuid.uuid4().hex[:8]


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

async def _create_org_user_wallet(
    db: AsyncSession,
    email: str | None = None,
    password: str = "testpassword123",
    org_name: str | None = None,
    balance_kobo: int = 1_000_000,
) -> tuple[Organization, Profile, Wallet]:
    suffix = _unique_suffix()
    if email is None:
        email = f"test-{suffix}@mazou.com"
    if org_name is None:
        org_name = f"Test Org {suffix}"

    org = Organization(
        id=str(uuid.uuid4()),
        name=org_name,
        slug=f"org-{suffix}",
        plan="free",
    )
    db.add(org)
    await db.flush()

    profile = Profile(
        id=str(uuid.uuid4()),
        org_id=org.id,
        email=email,
        password=hash_password(password),
        full_name="Test User",
        role="owner",
    )
    db.add(profile)

    wallet = Wallet(
        id=str(uuid.uuid4()),
        org_id=org.id,
        currency="NGN",
        balance_kobo=balance_kobo,
    )
    db.add(wallet)

    await db.commit()
    # expire_on_commit=False means objects are still usable after commit
    return org, profile, wallet


async def _create_api_key(
    db: AsyncSession,
    org_id: str,
    created_by: str,
    environment: str = "live",
) -> tuple[ApiKey, str]:
    prefix = f"mz_{environment}_"
    random_part = secrets.token_hex(20)
    full_key = prefix + random_part
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()

    api_key = ApiKey(
        id=str(uuid.uuid4()),
        org_id=org_id,
        name="Test Key",
        key_prefix=full_key[:12],
        key_hash=key_hash,
        environment=environment,
        status="active",
        created_by=created_by,
    )
    db.add(api_key)
    await db.commit()
    return api_key, full_key


# ---------------------------------------------------------------------------
# HTTP clients
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def client() -> AsyncClient:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


@pytest_asyncio.fixture
async def auth_client() -> AsyncClient:
    """Client with JWT cookie."""
    async with _test_session_factory() as session:
        org, profile, wallet = await _create_org_user_wallet(session)
        token = create_access_token(profile.id, org.id)

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        cookies={"mazou_session": token},
    ) as c:
        c._test_org = org  # type: ignore[attr-defined]
        c._test_profile = profile  # type: ignore[attr-defined]
        c._test_wallet = wallet  # type: ignore[attr-defined]
        yield c


@pytest_asyncio.fixture
async def api_key_client() -> AsyncClient:
    """Client with API key auth."""
    async with _test_session_factory() as session:
        org, profile, wallet = await _create_org_user_wallet(session)
        api_key, full_key = await _create_api_key(session, org.id, profile.id, environment="live")

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {full_key}"},
    ) as c:
        c._test_org = org  # type: ignore[attr-defined]
        c._test_profile = profile  # type: ignore[attr-defined]
        c._test_wallet = wallet  # type: ignore[attr-defined]
        c._test_api_key = api_key  # type: ignore[attr-defined]
        c._test_full_key = full_key  # type: ignore[attr-defined]
        yield c


@pytest_asyncio.fixture
async def test_key_client() -> AsyncClient:
    """Client with test API key (mz_test_*, balance=0)."""
    async with _test_session_factory() as session:
        org, profile, wallet = await _create_org_user_wallet(session, balance_kobo=0)
        api_key, full_key = await _create_api_key(session, org.id, profile.id, environment="test")

    transport = ASGITransport(app=app)
    async with AsyncClient(
        transport=transport,
        base_url="http://test",
        headers={"Authorization": f"Bearer {full_key}"},
    ) as c:
        c._test_org = org  # type: ignore[attr-defined]
        c._test_profile = profile  # type: ignore[attr-defined]
        c._test_wallet = wallet  # type: ignore[attr-defined]
        c._test_api_key = api_key  # type: ignore[attr-defined]
        c._test_full_key = full_key  # type: ignore[attr-defined]
        yield c
