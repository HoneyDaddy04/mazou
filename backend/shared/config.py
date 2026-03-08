import logging
import warnings
from pathlib import Path

from pydantic_settings import BaseSettings

_ENV_FILE = Path(__file__).resolve().parent.parent / ".env"


class Settings(BaseSettings):
    # Database (Supabase PostgreSQL via connection pooler)
    database_url: str = "sqlite+aiosqlite:///./mazou.db"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    supabase_jwt_secret: str = ""

    # Cache: "memory" for dev, "redis://..." for prod
    cache_url: str = "memory"

    # Auth
    secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 43200  # 30 days

    # Paystack
    paystack_secret_key: str = ""

    # Provider API keys
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    google_api_key: str = ""
    deepseek_api_key: str = ""
    mistral_api_key: str = ""

    # FX rate (NGN per 1 USD)
    fx_rate_ngn_usd: int = 1580

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # Mazou margin on managed mode
    managed_margin: float = 0.15

    model_config = {"env_file": str(_ENV_FILE), "env_file_encoding": "utf-8"}


settings = Settings()

if settings.secret_key == "change-me-in-production":
    warnings.warn(
        "SECRET_KEY is using the default value. Set a real secret in .env for production!",
        stacklevel=1,
    )
