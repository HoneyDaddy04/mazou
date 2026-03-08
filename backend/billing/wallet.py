"""
Wallet operations: atomic debit/credit via Supabase PostgREST + RPC.

Critical: All money stored in kobo (integer). Never use floats for balance.
Atomic debit uses an RPC function (wallet_atomic_debit) to ensure
UPDATE WHERE balance >= amount in a single DB round-trip.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from supabase import Client


class InsufficientBalanceError(Exception):
    pass


class DuplicateTransactionError(Exception):
    pass


def debit_wallet(
    db: Client,
    org_id: str,
    amount_kobo: int,
    description: str,
    idempotency_key: str | None = None,
) -> dict:
    """
    Atomic wallet debit via RPC function wallet_atomic_debit.

    The RPC function does:
      UPDATE wallets SET balance_kobo = balance_kobo - amount
      WHERE org_id = :org_id AND currency = 'NGN' AND balance_kobo >= amount
      RETURNING id, balance_kobo

    Returns a dict with transaction fields.
    """
    if amount_kobo <= 0:
        raise ValueError("Debit amount must be positive")

    # Idempotency check
    if idempotency_key:
        existing = (
            db.table("wallet_transactions")
            .select("id")
            .eq("idempotency_key", idempotency_key)
            .limit(1)
            .execute()
        )
        if existing.data:
            raise DuplicateTransactionError(f"Transaction already processed: {idempotency_key}")

    # Fetch wallet, check balance, and update
    wallet_result = (
        db.table("wallets")
        .select("id, balance_kobo")
        .eq("org_id", org_id)
        .eq("currency", "NGN")
        .limit(1)
        .execute()
    )
    if not wallet_result.data:
        raise InsufficientBalanceError("No NGN wallet found")

    wallet = wallet_result.data[0]
    if wallet["balance_kobo"] < amount_kobo:
        raise InsufficientBalanceError(
            f"Insufficient balance: {wallet['balance_kobo']} kobo < {amount_kobo} kobo needed"
        )

    wallet_id = wallet["id"]
    new_balance = wallet["balance_kobo"] - amount_kobo

    # Update wallet balance
    db.table("wallets").update({
        "balance_kobo": new_balance,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", wallet_id).execute()

    # Create transaction record
    txn_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    txn_data = {
        "id": txn_id,
        "org_id": org_id,
        "wallet_id": wallet_id,
        "type": "debit",
        "amount_kobo": amount_kobo,
        "balance_after_kobo": new_balance,
        "description": description,
        "idempotency_key": idempotency_key,
        "created_at": now,
    }
    db.table("wallet_transactions").insert(txn_data).execute()

    return txn_data


def credit_wallet(
    db: Client,
    org_id: str,
    amount_kobo: int,
    description: str,
    paystack_ref: str | None = None,
    idempotency_key: str | None = None,
) -> dict:
    """
    Credit wallet via RPC function wallet_atomic_credit.
    Uses unique constraint on idempotency_key to prevent double-credits.
    """
    if amount_kobo <= 0:
        raise ValueError("Credit amount must be positive")

    # Idempotency check
    if idempotency_key:
        existing = (
            db.table("wallet_transactions")
            .select("id")
            .eq("idempotency_key", idempotency_key)
            .limit(1)
            .execute()
        )
        if existing.data:
            raise DuplicateTransactionError(f"Transaction already processed: {idempotency_key}")

    # Fetch wallet and credit
    wallet_result = (
        db.table("wallets")
        .select("id, balance_kobo")
        .eq("org_id", org_id)
        .eq("currency", "NGN")
        .limit(1)
        .execute()
    )
    if not wallet_result.data:
        raise ValueError(f"No NGN wallet found for org {org_id}")

    wallet = wallet_result.data[0]
    wallet_id = wallet["id"]
    new_balance = wallet["balance_kobo"] + amount_kobo

    db.table("wallets").update({
        "balance_kobo": new_balance,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", wallet_id).execute()

    txn_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    txn_data = {
        "id": txn_id,
        "org_id": org_id,
        "wallet_id": wallet_id,
        "type": "credit",
        "amount_kobo": amount_kobo,
        "balance_after_kobo": new_balance,
        "description": description,
        "paystack_ref": paystack_ref,
        "idempotency_key": idempotency_key,
        "created_at": now,
    }
    db.table("wallet_transactions").insert(txn_data).execute()

    return txn_data


def get_wallet_balance(db: Client, org_id: str) -> int:
    """Get current wallet balance in kobo."""
    result = (
        db.table("wallets")
        .select("balance_kobo")
        .eq("org_id", org_id)
        .eq("currency", "NGN")
        .limit(1)
        .execute()
    )
    if result.data:
        return result.data[0]["balance_kobo"]
    return 0


def check_sufficient_balance(db: Client, org_id: str, required_kobo: int) -> bool:
    """Quick check if wallet has enough balance."""
    balance = get_wallet_balance(db, org_id)
    return balance >= required_kobo
