"""Wallet endpoints: balance, transactions, topup."""

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from backend.shared.database import get_db
from backend.gateway.middleware.auth import ProfileData, get_current_user
from backend.shared.schemas import TopupRequest, TransactionOut, WalletOut

router = APIRouter()


@router.get("/wallet", response_model=WalletOut)
async def get_wallet(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("wallets")
        .select("*")
        .eq("org_id", user.org_id)
        .eq("currency", "NGN")
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Wallet not found")

    wallet = result.data[0]
    return WalletOut(
        id=wallet["id"],
        currency=wallet["currency"],
        balance_naira=wallet["balance_kobo"] / 100,
        balance_kobo=wallet["balance_kobo"],
        auto_fund_threshold_naira=(
            wallet["auto_fund_threshold_kobo"] / 100
            if wallet.get("auto_fund_threshold_kobo")
            else None
        ),
        auto_fund_amount_naira=(
            wallet["auto_fund_amount_kobo"] / 100
            if wallet.get("auto_fund_amount_kobo")
            else None
        ),
    )


@router.get("/wallet/transactions", response_model=list[TransactionOut])
async def list_transactions(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
    limit: int = 50,
):
    result = (
        db.table("wallet_transactions")
        .select("*")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return [
        TransactionOut(
            id=t["id"],
            type=t["type"],
            amount_naira=t["amount_kobo"] / 100,
            amount_kobo=t["amount_kobo"],
            balance_after_naira=t["balance_after_kobo"] / 100,
            description=t["description"],
            reference=t.get("reference") or t.get("paystack_ref"),
            created_at=t["created_at"],
        )
        for t in (result.data or [])
    ]


@router.post("/wallet/topup")
async def initiate_topup(
    body: TopupRequest,
    user: ProfileData = Depends(get_current_user),
):
    """Initialize Paystack transaction for wallet top-up."""
    from backend.billing.paystack import initialize_transaction

    amount_kobo = int(body.amount_naira * 100)

    try:
        data = await initialize_transaction(
            email=user.email,
            amount_kobo=amount_kobo,
            org_id=user.org_id,
            callback_url=body.callback_url,
        )
        return {
            "authorization_url": data.get("authorization_url"),
            "reference": data.get("reference"),
            "amount_naira": body.amount_naira,
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to initialize payment. Please try again.")
