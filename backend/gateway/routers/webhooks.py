"""Webhook handlers: Paystack payment confirmation."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from backend.billing.paystack import verify_transaction, verify_webhook_signature
from backend.billing.wallet import DuplicateTransactionError, credit_wallet
from backend.shared.database import get_supabase

router = APIRouter()


@router.post("/paystack")
async def paystack_webhook(request: Request):
    """
    Handle Paystack webhook for successful payments.

    Flow:
    1. Verify HMAC-SHA512 signature
    2. Parse event data
    3. Verify transaction via Paystack API
    4. Credit wallet with idempotency key
    """
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    # 1. Verify webhook signature
    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # 2. Parse event
    import json
    event = json.loads(body)
    event_type = event.get("event")

    if event_type != "charge.success":
        # Acknowledge but ignore non-payment events
        return {"ok": True, "message": f"Ignored event: {event_type}"}

    data = event.get("data", {})
    reference = data.get("reference")
    amount_kobo = data.get("amount", 0)  # Paystack sends amount in kobo
    metadata = data.get("metadata", {})
    org_id = metadata.get("org_id")

    if not reference or not org_id:
        raise HTTPException(status_code=400, detail="Missing reference or org_id in webhook")

    # 3. Verify transaction via Paystack API
    try:
        verified = await verify_transaction(reference)
        if verified.get("status") != "success":
            raise HTTPException(status_code=400, detail="Transaction not successful")

        # Cross-check amount
        if verified.get("amount") != amount_kobo:
            raise HTTPException(
                status_code=400,
                detail=f"Amount mismatch: webhook={amount_kobo}, verified={verified.get('amount')}",
            )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 4. Credit wallet with idempotency
    db = get_supabase()
    try:
        txn = credit_wallet(
            db=db,
            org_id=org_id,
            amount_kobo=amount_kobo,
            description=f"Paystack top-up (ref: {reference})",
            paystack_ref=reference,
            idempotency_key=f"paystack:{reference}",
        )
        return {
            "ok": True,
            "message": "Wallet credited",
            "amount_kobo": amount_kobo,
            "amount_naira": amount_kobo / 100,
            "reference": reference,
        }
    except DuplicateTransactionError:
        # Already processed -- idempotent response
        return {"ok": True, "message": "Already processed", "reference": reference}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to credit wallet: {str(e)}")
