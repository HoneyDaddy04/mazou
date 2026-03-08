"""Monthly invoice generation from usage logs via Supabase RPC."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from supabase import Client


async def generate_monthly_invoice(
    db: Client,
    org_id: str,
    year: int,
    month: int,
) -> dict | None:
    """
    Generate a monthly invoice for an org.
    Aggregates usage_logs for the given month.
    Returns None if no usage found or invoice already exists.
    """
    period_start = datetime(year, month, 1, tzinfo=timezone.utc).isoformat()
    if month == 12:
        period_end = datetime(year + 1, 1, 1, tzinfo=timezone.utc).isoformat()
    else:
        period_end = datetime(year, month + 1, 1, tzinfo=timezone.utc).isoformat()

    # Check for existing invoice
    existing = (
        db.table("invoices")
        .select("id")
        .eq("org_id", org_id)
        .eq("period_start", period_start)
        .eq("period_end", period_end)
        .limit(1)
        .execute()
    )
    if existing.data:
        return None  # Already generated

    # Aggregate usage via RPC
    result = db.rpc(
        "usage_summary",
        {"p_org_id": org_id, "p_since": period_start},
    ).execute()

    row = result.data
    if isinstance(row, list):
        row = row[0] if row else {}

    total_cost = row.get("total_cost_kobo", 0) or 0
    total_calls = row.get("total_calls", 0) or 0

    if total_calls == 0:
        return None

    invoice_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    invoice_data = {
        "id": invoice_id,
        "org_id": org_id,
        "period_start": period_start,
        "period_end": period_end,
        "total_cost_kobo": total_cost,
        "total_calls": total_calls,
        "currency": "NGN",
        "status": "paid",  # Prepaid wallet model -- already debited
        "created_at": now,
    }
    db.table("invoices").insert(invoice_data).execute()

    return invoice_data
