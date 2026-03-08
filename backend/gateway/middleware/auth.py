"""Authentication middleware: Supabase JWT session auth + API key auth."""

from __future__ import annotations

import hashlib
import json
import logging
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone

import httpx
import jwt as pyjwt
from jwt.algorithms import ECAlgorithm
from fastapi import Depends, HTTPException, Request
from supabase import Client

from backend.shared.cache import CacheBackend
from backend.shared.config import settings
from backend.shared.database import get_db

logger = logging.getLogger(__name__)

# ── JWKS cache for ES256 verification ────────────────────────────────
_jwks_cache: dict | None = None


def _get_jwks_key():
    """Fetch and cache the Supabase JWKS public key for ES256 verification."""
    global _jwks_cache
    if _jwks_cache is not None:
        return _jwks_cache

    jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
    resp = httpx.get(jwks_url, headers={"apikey": settings.supabase_service_key}, timeout=10)
    resp.raise_for_status()
    jwks = resp.json()

    # Get the first ES256 key
    for key_data in jwks.get("keys", []):
        if key_data.get("alg") == "ES256":
            public_key = ECAlgorithm(ECAlgorithm.SHA256).from_jwk(json.dumps(key_data))
            _jwks_cache = {"key": public_key, "kid": key_data.get("kid")}
            return _jwks_cache

    raise RuntimeError("No ES256 key found in Supabase JWKS")


# ── Lightweight data holders (replace ORM objects) ─────────────────────


@dataclass
class ProfileData:
    """Lightweight profile object replacing the SQLAlchemy Profile model."""
    id: str
    org_id: str
    supabase_uid: str | None
    email: str
    full_name: str | None
    role: str
    is_superadmin: bool
    created_at: str | None = None

    # Attached org data (populated by get_current_user)
    org: "OrgData | None" = None


@dataclass
class OrgData:
    """Lightweight org object replacing the SQLAlchemy Organization model."""
    id: str
    name: str
    slug: str
    plan: str
    status: str


@dataclass
class ApiKeyRow:
    """Lightweight API key object."""
    id: str
    org_id: str
    name: str
    key_prefix: str
    key_hash: str
    environment: str
    last_used_at: str | None
    total_calls: int
    status: str
    rate_limit_rpm: int
    created_at: str | None


@dataclass
class ApiKeyData:
    key: ApiKeyRow
    org: OrgData
    is_test: bool


# ── Supabase JWT verification ─────────────────────────────────────────


def decode_supabase_token(token: str) -> dict:
    """Decode and verify a Supabase JWT token (ES256 via JWKS or HS256 fallback)."""
    # First, peek at the header to determine the algorithm
    try:
        header = pyjwt.get_unverified_header(token)
    except pyjwt.InvalidTokenError as e:
        logger.debug(f"JWT header decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        if header.get("alg") == "ES256":
            jwks = _get_jwks_key()
            payload = pyjwt.decode(
                token,
                jwks["key"],
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            # Fallback to HS256 (older Supabase projects)
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        return payload
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        logger.warning(f"JWT decode error ({type(e).__name__}): {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")


# ── Auto-provision new users ──────────────────────────────────────────


def _auto_provision_user(db: Client, supabase_uid: str, jwt_payload: dict):
    """Create org, profile, and wallet for a new Supabase user on first login."""
    meta = jwt_payload.get("user_metadata", {})
    email = jwt_payload.get("email", "")
    full_name = meta.get("full_name", email.split("@")[0])
    org_name = meta.get("org_name", f"{full_name}'s Org")
    slug = org_name.lower().replace(" ", "-").replace("'", "")[:50]

    now = datetime.now(timezone.utc).isoformat()
    org_id = str(uuid.uuid4())
    profile_id = str(uuid.uuid4())
    wallet_id = str(uuid.uuid4())

    try:
        # Create organization
        db.table("organizations").insert({
            "id": org_id,
            "name": org_name,
            "slug": slug,
            "plan": "free",
            "status": "active",
            "created_at": now,
            "updated_at": now,
        }).execute()

        # Create profile
        db.table("profiles").insert({
            "id": profile_id,
            "org_id": org_id,
            "supabase_uid": supabase_uid,
            "email": email,
            "full_name": full_name,
            "role": "owner",
            "is_superadmin": False,
            "created_at": now,
        }).execute()

        # Create wallet
        db.table("wallets").insert({
            "id": wallet_id,
            "org_id": org_id,
            "currency": "NGN",
            "balance_kobo": 0,
            "updated_at": now,
        }).execute()

        logger.info(f"Auto-provisioned user {email} (org: {org_name})")

        # Re-fetch with org join
        return (
            db.table("profiles")
            .select("*, organizations(*)")
            .eq("supabase_uid", supabase_uid)
            .limit(1)
            .execute()
        )
    except Exception as e:
        logger.error(f"Auto-provision failed for {email}: {e}")
        # Return empty result — caller will raise 401
        class EmptyResult:
            data = None
        return EmptyResult()


# ── Session auth dependency (dashboard) ─────────────────────────────────


async def get_current_user(
    request: Request,
    db: Client = Depends(get_db),
) -> ProfileData:
    """Extract user from Supabase JWT in Authorization header or cookie."""
    token = request.cookies.get("mazou_session")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.startswith("Bearer ") and not auth[7:].startswith("mz_"):
            token = auth[7:]

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    payload = decode_supabase_token(token)
    supabase_uid = payload.get("sub")
    if not supabase_uid:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    # Look up profile by supabase_uid, join with org
    result = (
        db.table("profiles")
        .select("*, organizations(*)")
        .eq("supabase_uid", supabase_uid)
        .limit(1)
        .execute()
    )
    if not result.data:
        # Auto-provision: create org, profile, and wallet for new Supabase users
        result = _auto_provision_user(db, supabase_uid, payload)
        if not result.data:
            raise HTTPException(status_code=401, detail="User not found")

    row = result.data[0]
    org_row = row.get("organizations", {})

    org = OrgData(
        id=org_row["id"],
        name=org_row["name"],
        slug=org_row["slug"],
        plan=org_row["plan"],
        status=org_row.get("status", "active"),
    )

    profile = ProfileData(
        id=row["id"],
        org_id=row["org_id"],
        supabase_uid=row.get("supabase_uid"),
        email=row["email"],
        full_name=row.get("full_name"),
        role=row.get("role", "member"),
        is_superadmin=row.get("is_superadmin", False),
        created_at=row.get("created_at"),
        org=org,
    )

    return profile


# ── API key auth dependency (gateway /v1/ endpoints) ────────────────────


def _get_cache_from_app(request: Request) -> CacheBackend:
    return request.app.state.cache


async def validate_api_key(
    request: Request,
    db: Client = Depends(get_db),
) -> ApiKeyData:
    """Validate Bearer mz_* API key from Authorization header."""
    auth = request.headers.get("authorization", "")
    if not auth.startswith("Bearer mz_"):
        raise HTTPException(
            status_code=401,
            detail="Invalid API key format. Expected: Bearer mz_live_... or mz_test_...",
        )

    raw_key = auth[7:]
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    is_test = raw_key.startswith("mz_test_")

    # Check cache first
    cache = _get_cache_from_app(request)
    cached = await cache.get(f"apikey:{key_hash}")
    if cached:
        data = json.loads(cached)
        # Fetch fresh from DB to confirm still active
        result = (
            db.table("api_keys")
            .select("*, organizations(*)")
            .eq("id", data["id"])
            .eq("status", "active")
            .limit(1)
            .execute()
        )
        if result.data:
            row = result.data[0]
            org_row = row.get("organizations", {})
            org = OrgData(
                id=org_row["id"],
                name=org_row["name"],
                slug=org_row["slug"],
                plan=org_row["plan"],
                status=org_row.get("status", "active"),
            )
            api_key = ApiKeyRow(
                id=row["id"],
                org_id=row["org_id"],
                name=row["name"],
                key_prefix=row["key_prefix"],
                key_hash=row["key_hash"],
                environment=row["environment"],
                last_used_at=row.get("last_used_at"),
                total_calls=row.get("total_calls", 0),
                status=row["status"],
                rate_limit_rpm=row.get("rate_limit_rpm", 600),
                created_at=row.get("created_at"),
            )
            return ApiKeyData(key=api_key, org=org, is_test=is_test)

    # DB lookup
    result = (
        db.table("api_keys")
        .select("*, organizations(*)")
        .eq("key_hash", key_hash)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")

    row = result.data[0]
    org_row = row.get("organizations", {})
    org = OrgData(
        id=org_row["id"],
        name=org_row["name"],
        slug=org_row["slug"],
        plan=org_row["plan"],
        status=org_row.get("status", "active"),
    )
    api_key = ApiKeyRow(
        id=row["id"],
        org_id=row["org_id"],
        name=row["name"],
        key_prefix=row["key_prefix"],
        key_hash=row["key_hash"],
        environment=row["environment"],
        last_used_at=row.get("last_used_at"),
        total_calls=row.get("total_calls", 0),
        status=row["status"],
        rate_limit_rpm=row.get("rate_limit_rpm", 600),
        created_at=row.get("created_at"),
    )

    # Cache for 5 minutes
    await cache.set(
        f"apikey:{key_hash}",
        json.dumps({"id": api_key.id, "org_id": api_key.org_id}),
        ttl=300,
    )

    return ApiKeyData(key=api_key, org=org, is_test=is_test)


# ── Rate limiter ────────────────────────────────────────────────────────


async def check_rate_limit(
    request: Request,
    key_data: ApiKeyData,
) -> None:
    """Check rate limit for the org/key. Raises 429 if exceeded."""
    cache = _get_cache_from_app(request)
    limit = key_data.key.rate_limit_rpm or 600
    window = 60  # 1 minute

    # Rate limit per API key
    count = await cache.incr_sliding_window(f"rl:{key_data.key.id}", window)
    if count > limit:
        raise HTTPException(
            status_code=429,
            detail="Rate limit exceeded",
            headers={
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "Retry-After": str(window),
            },
        )
