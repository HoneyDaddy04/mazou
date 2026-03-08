from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.shared.cache import CacheBackend, create_cache
from backend.shared.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create cache
    app.state.cache = create_cache(settings.cache_url)

    # Auto-seed demo data (idempotent — skips if data exists)
    try:
        from backend.shared.seed import seed
        await seed()
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Seed skipped: {e}")

    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Mazou API",
    description="AI Gateway & Cost Management for Africa",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_cache() -> CacheBackend:
    """FastAPI dependency: returns the cache backend."""
    return app.state.cache


# --- Mount routers (imported after app is created to avoid circular imports) ---

from backend.gateway.routers import admin, auth, byok, keys, completions, models, usage, wallet, webhooks, dashboard, routing  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(completions.router, prefix="/v1", tags=["gateway"])
app.include_router(models.router, prefix="/v1", tags=["models"])
app.include_router(keys.router, prefix="/v1", tags=["keys"])
app.include_router(usage.router, prefix="/v1", tags=["usage"])
app.include_router(wallet.router, prefix="/v1", tags=["wallet"])
app.include_router(byok.router, prefix="/v1", tags=["byok"])
app.include_router(webhooks.router, prefix="/webhooks", tags=["webhooks"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(routing.router, prefix="/api/routing", tags=["routing"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])


@app.get("/health")
async def health():
    return {"status": "ok", "service": "mazou-gateway"}
