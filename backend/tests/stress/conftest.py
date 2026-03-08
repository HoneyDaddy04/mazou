"""
Stress test conftest -- overrides parent conftest fixtures to avoid conflicts.

The parent conftest uses NullPool and monkey-patches db_module at import time,
which is fine. We override session-scoped fixtures to provide our own engine
with a real connection pool (needed for concurrent stress testing), and
override cleanup/client fixtures to be no-ops.
"""

import asyncio
import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.shared.models import Base

DB_URL = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/mazou",
)


# Override parent's session-scoped setup_database
@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_database():
    """Create engine with real pool for stress testing, patch db module."""
    eng = create_async_engine(DB_URL, echo=False, pool_size=30, max_overflow=40)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    sf = async_sessionmaker(eng, class_=AsyncSession, expire_on_commit=False)

    # Monkey-patch shared database module (overwriting parent conftest's patch)
    import backend.shared.database as db_mod
    db_mod.engine = eng
    db_mod.AsyncSessionLocal = sf

    # Also set up app.state.cache for the gateway
    from backend.shared.cache import MemoryCache
    from backend.gateway.main import app
    app.state.cache = MemoryCache()

    yield {"engine": eng, "sf": sf}

    await eng.dispose()


# Override parent's clean_tables (no-op -- we use unique org IDs)
@pytest_asyncio.fixture(autouse=True)
async def clean_tables():
    yield


# Override parent's db fixture
@pytest_asyncio.fixture
async def db():
    yield None  # Not used; stress tests use sf directly


# Provide sf (session factory) -- session-scoped
@pytest_asyncio.fixture(scope="session")
async def sf(setup_database):
    return setup_database["sf"]


# Override parent's client
@pytest_asyncio.fixture
async def client():
    from backend.gateway.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c


# Override parent's auth_client, api_key_client, test_key_client
@pytest_asyncio.fixture
async def auth_client():
    yield None


@pytest_asyncio.fixture
async def api_key_client():
    yield None


@pytest_asyncio.fixture
async def test_key_client():
    yield None
