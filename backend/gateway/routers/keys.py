"""API key management: create, list, revoke."""

import hashlib
import secrets
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from backend.shared.database import get_db
from backend.gateway.middleware.auth import ProfileData, get_current_user
from backend.shared.schemas import ApiKeyCreated, ApiKeyOut, CreateKeyRequest

router = APIRouter()


def _generate_key(environment: str) -> tuple[str, str, str]:
    """Generate API key, return (full_key, prefix, hash)."""
    prefix = f"mz_{environment}_"
    random_part = secrets.token_hex(20)
    full_key = prefix + random_part
    key_hash = hashlib.sha256(full_key.encode()).hexdigest()
    key_prefix = full_key[:12]
    return full_key, key_prefix, key_hash


@router.post("/keys", response_model=ApiKeyCreated)
async def create_key(
    body: CreateKeyRequest,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    full_key, key_prefix, key_hash = _generate_key(body.environment)

    key_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "id": key_id,
        "org_id": user.org_id,
        "name": body.name,
        "key_prefix": key_prefix,
        "key_hash": key_hash,
        "environment": body.environment,
        "created_by": user.id,
        "status": "active",
        "total_calls": 0,
        "rate_limit_rpm": 600,
        "created_at": now,
    }
    db.table("api_keys").insert(row).execute()

    return ApiKeyCreated(
        id=key_id,
        name=body.name,
        key_prefix=key_prefix,
        environment=body.environment,
        status="active",
        total_calls=0,
        last_used_at=None,
        created_at=now,
        key=full_key,  # Shown once
    )


@router.get("/keys", response_model=list[ApiKeyOut])
async def list_keys(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("api_keys")
        .select("*")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [
        ApiKeyOut(
            id=k["id"],
            name=k["name"],
            key_prefix=k["key_prefix"],
            environment=k["environment"],
            status=k["status"],
            total_calls=k.get("total_calls", 0),
            last_used_at=k.get("last_used_at"),
            created_at=k["created_at"],
        )
        for k in (result.data or [])
    ]


@router.delete("/keys/{key_id}")
async def revoke_key(
    key_id: str,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("api_keys")
        .select("id")
        .eq("id", key_id)
        .eq("org_id", user.org_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="API key not found")

    db.table("api_keys").update({"status": "revoked"}).eq("id", key_id).execute()
    return {"ok": True, "message": "API key revoked"}
