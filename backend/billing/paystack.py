"""Paystack integration: initialize transactions, verify webhooks."""

from __future__ import annotations

import hashlib
import hmac

import httpx

from backend.shared.config import settings

PAYSTACK_BASE = "https://api.paystack.co"


async def initialize_transaction(
    email: str,
    amount_kobo: int,
    org_id: str,
    callback_url: str | None = None,
) -> dict:
    """Initialize a Paystack transaction for wallet top-up."""
    payload = {
        "email": email,
        "amount": amount_kobo,  # Paystack expects kobo
        "metadata": {"org_id": org_id, "type": "wallet_topup"},
    }
    if callback_url:
        payload["callback_url"] = callback_url

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{PAYSTACK_BASE}/transaction/initialize",
            json=payload,
            headers={"Authorization": f"Bearer {settings.paystack_secret_key}"},
            timeout=30,
        )
        data = resp.json()
        if not data.get("status"):
            raise ValueError(f"Paystack error: {data.get('message', 'Unknown error')}")
        return data["data"]


async def verify_transaction(reference: str) -> dict:
    """Verify a Paystack transaction by reference."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{PAYSTACK_BASE}/transaction/verify/{reference}",
            headers={"Authorization": f"Bearer {settings.paystack_secret_key}"},
            timeout=30,
        )
        data = resp.json()
        if not data.get("status"):
            raise ValueError(f"Paystack verification error: {data.get('message')}")
        return data["data"]


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Paystack webhook HMAC-SHA512 signature."""
    expected = hmac.new(
        settings.paystack_secret_key.encode(),
        body,
        hashlib.sha512,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
