"""BYOK (Bring Your Own Keys) CRUD endpoints."""

import logging
import uuid
from datetime import datetime, timezone

import litellm
from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from backend.gateway.middleware.auth import ProfileData, get_current_user
from backend.shared.database import get_db
from backend.shared.encryption import decrypt_key, encrypt_key
from backend.shared.pricing import LITELLM_MODEL_MAP
from backend.shared.schemas import ByokKeyCreate, ByokKeyOut

logger = logging.getLogger(__name__)

router = APIRouter()

# A lightweight model per provider to use for key validation
_TEST_MODELS: dict[str, str] = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-haiku-4.5",
    "google": "gemini-2.5-flash",
    "deepseek": "deepseek-v3.1",
    "mistral": "mistral-large-2",
}


@router.post("/byok", response_model=ByokKeyOut, status_code=201)
async def create_byok_key(
    body: ByokKeyCreate,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Store an encrypted provider API key for BYOK usage."""
    encrypted = encrypt_key(body.api_key)

    key_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "id": key_id,
        "org_id": user.org_id,
        "provider": body.provider,
        "key_encrypted": encrypted,
        "label": body.label,
        "status": "connected",
        "created_at": now,
    }
    db.table("byok_keys").insert(row).execute()

    return ByokKeyOut(
        id=key_id,
        provider=body.provider,
        label=body.label,
        status="connected",
        created_at=now,
    )


@router.get("/byok", response_model=list[ByokKeyOut])
async def list_byok_keys(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """List all BYOK keys for the user's org."""
    result = (
        db.table("byok_keys")
        .select("*")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [
        ByokKeyOut(
            id=k["id"],
            provider=k["provider"],
            label=k["label"],
            status=k["status"],
            created_at=k["created_at"],
        )
        for k in (result.data or [])
    ]


@router.delete("/byok/{key_id}", status_code=204)
async def delete_byok_key(
    key_id: str,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Delete a BYOK key. Verifies org ownership."""
    result = (
        db.table("byok_keys")
        .select("id")
        .eq("id", key_id)
        .eq("org_id", user.org_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="BYOK key not found")

    db.table("byok_keys").delete().eq("id", key_id).execute()


@router.post("/byok/{key_id}/test")
async def test_byok_key(
    key_id: str,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Test a BYOK key by making a lightweight LiteLLM call."""
    result = (
        db.table("byok_keys")
        .select("*")
        .eq("id", key_id)
        .eq("org_id", user.org_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="BYOK key not found")

    key = result.data[0]

    try:
        decrypted = decrypt_key(key["key_encrypted"])
    except Exception:
        db.table("byok_keys").update({"status": "error"}).eq("id", key_id).execute()
        return {"valid": False, "error": "Failed to decrypt stored key"}

    test_model_id = _TEST_MODELS.get(key["provider"])
    if not test_model_id:
        return {"valid": False, "error": f"No test model configured for provider: {key['provider']}"}

    litellm_name = LITELLM_MODEL_MAP.get(test_model_id, f"{key['provider']}/{test_model_id}")

    try:
        await litellm.acompletion(
            model=litellm_name,
            messages=[{"role": "user", "content": "Hi"}],
            api_key=decrypted,
            max_tokens=5,
        )
        db.table("byok_keys").update({"status": "connected"}).eq("id", key_id).execute()
        return {"valid": True, "error": None}
    except Exception as e:
        db.table("byok_keys").update({"status": "error"}).eq("id", key_id).execute()
        return {"valid": False, "error": str(e)}
