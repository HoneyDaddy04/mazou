"""
Token bundle operations: fixed-rate prepaid token packages.

Bundles let orgs buy a set number of tokens at a fixed NGN rate,
protecting against exchange rate fluctuations. When a bundle is active,
API calls deduct from bundle tokens instead of the wallet.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from supabase import Client


class BundleExhaustedError(Exception):
    pass


# ── Available bundle packages ────────────────────────────────────────────

BUNDLE_PACKAGES = [
    {
        "id": "starter_5m",
        "name": "Starter 5M",
        "tokens": 5_000_000,
        "price_kobo": 500_000,       # NGN 5,000
        "rate_per_million_kobo": 100_000,  # NGN 1,000 per 1M tokens
    },
    {
        "id": "growth_25m",
        "name": "Growth 25M",
        "tokens": 25_000_000,
        "price_kobo": 2_000_000,      # NGN 20,000
        "rate_per_million_kobo": 80_000,   # NGN 800 per 1M tokens (20% discount)
    },
    {
        "id": "business_100m",
        "name": "Business 100M",
        "tokens": 100_000_000,
        "price_kobo": 6_000_000,      # NGN 60,000
        "rate_per_million_kobo": 60_000,   # NGN 600 per 1M tokens (40% discount)
    },
    {
        "id": "enterprise_500m",
        "name": "Enterprise 500M",
        "tokens": 500_000_000,
        "price_kobo": 20_000_000,     # NGN 200,000
        "rate_per_million_kobo": 40_000,   # NGN 400 per 1M tokens (60% discount)
    },
]


def get_bundle_packages() -> list[dict]:
    """Return available bundle packages with display pricing."""
    return [
        {
            **pkg,
            "price_naira": round(pkg["price_kobo"] / 100, 2),
            "rate_per_million_naira": round(pkg["rate_per_million_kobo"] / 100, 2),
        }
        for pkg in BUNDLE_PACKAGES
    ]


def get_active_bundle(db: Client, org_id: str) -> dict | None:
    """Get the org's active bundle with remaining tokens, or None."""
    now = datetime.now(timezone.utc).isoformat()
    result = (
        db.table("token_bundles")
        .select("id, name, total_tokens, remaining_tokens, price_kobo, rate_per_million_kobo, expires_at")
        .eq("org_id", org_id)
        .eq("status", "active")
        .gt("remaining_tokens", 0)
        .order("created_at")
        .limit(1)
        .execute()
    )
    if not result.data:
        return None
    bundle = result.data[0]
    # Check expiry
    if bundle.get("expires_at") and bundle["expires_at"] < now:
        return None
    return bundle


def purchase_bundle(
    db: Client,
    org_id: str,
    package_id: str,
    expires_at: str | None = None,
) -> dict:
    """
    Purchase a token bundle by debiting the wallet and creating the bundle.
    Returns the created bundle record.
    """
    # Find the package
    pkg = next((p for p in BUNDLE_PACKAGES if p["id"] == package_id), None)
    if not pkg:
        raise ValueError(f"Unknown bundle package: {package_id}")

    # Debit wallet for the bundle price
    from backend.billing.wallet import debit_wallet

    debit_wallet(
        db,
        org_id,
        pkg["price_kobo"],
        f"Token bundle: {pkg['name']} ({pkg['tokens']:,} tokens)",
        idempotency_key=f"bundle:{org_id}:{package_id}:{uuid.uuid4().hex[:8]}",
    )

    # Create the bundle
    bundle_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    bundle_data = {
        "id": bundle_id,
        "org_id": org_id,
        "name": pkg["name"],
        "total_tokens": pkg["tokens"],
        "remaining_tokens": pkg["tokens"],
        "price_kobo": pkg["price_kobo"],
        "rate_per_million_kobo": pkg["rate_per_million_kobo"],
        "status": "active",
        "purchased_at": now,
        "expires_at": expires_at,
        "created_at": now,
    }
    db.table("token_bundles").insert(bundle_data).execute()

    return bundle_data


def debit_bundle(
    db: Client,
    bundle_id: str,
    total_tokens: int,
) -> dict:
    """
    Debit tokens from a bundle.
    Returns {bundle_id, remaining_tokens} or raises BundleExhaustedError.
    """
    if total_tokens <= 0:
        raise ValueError("Token debit must be positive")

    # Fetch bundle
    result = (
        db.table("token_bundles")
        .select("id, remaining_tokens, status, expires_at")
        .eq("id", bundle_id)
        .eq("status", "active")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise BundleExhaustedError(f"Bundle {bundle_id} not found or inactive")

    bundle = result.data[0]
    if bundle["remaining_tokens"] < total_tokens:
        raise BundleExhaustedError(f"Bundle {bundle_id} has insufficient remaining tokens")

    now = datetime.now(timezone.utc).isoformat()
    if bundle.get("expires_at") and bundle["expires_at"] < now:
        raise BundleExhaustedError(f"Bundle {bundle_id} has expired")

    new_remaining = bundle["remaining_tokens"] - total_tokens
    db.table("token_bundles").update({"remaining_tokens": new_remaining}).eq("id", bundle_id).execute()

    return {"bundle_id": bundle_id, "remaining_tokens": new_remaining}


def list_bundles(db: Client, org_id: str) -> list[dict]:
    """List all bundles for an org (active first, then expired/exhausted)."""
    result = (
        db.table("token_bundles")
        .select("*")
        .eq("org_id", org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
