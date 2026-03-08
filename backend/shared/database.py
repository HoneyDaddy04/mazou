"""Supabase client factory for Mazou backend.

Replaces SQLAlchemy async engine with supabase-py PostgREST client.
The service role key bypasses RLS so the backend controls all access.
"""

from supabase import create_client, Client

from backend.shared.config import settings

# Module-level singleton: created once on import
_supabase_client: Client | None = None


def get_supabase() -> Client:
    """Return the singleton Supabase client (creates on first call)."""
    global _supabase_client
    if _supabase_client is None:
        if not settings.supabase_url or not settings.supabase_service_key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env"
            )
        _supabase_client = create_client(settings.supabase_url, settings.supabase_service_key)
    return _supabase_client


def get_db() -> Client:
    """FastAPI dependency: returns the Supabase client."""
    return get_supabase()
