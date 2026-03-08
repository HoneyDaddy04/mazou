"""Dashboard API: stats, analytics, recommendations for the Next.js frontend."""

from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from backend.shared.database import get_db
from backend.gateway.middleware.auth import ProfileData, get_current_user
from backend.shared.schemas import DashboardStats, RecommendationOut, TokenBundleOut, PurchaseBundleRequest

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def dashboard_stats(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    org_id = user.org_id
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    prev_since = (datetime.now(timezone.utc) - timedelta(days=days * 2)).isoformat()

    # Fetch all usage logs for the period (PostgREST, no RPC needed)
    all_logs = (
        db.table("usage_logs")
        .select("model, provider, feature_tag, cost_kobo, savings_kobo, input_tokens, output_tokens, is_test, created_at, request_id, routed_from, routed_to, routing_reason")
        .eq("org_id", org_id)
        .eq("is_test", False)
        .gte("created_at", since)
        .order("created_at", desc=True)
        .limit(5000)
        .execute()
    )
    rows = all_logs.data or []

    total_cost_kobo = sum(r.get("cost_kobo", 0) or 0 for r in rows)
    total_calls = len(rows)
    active_models = len(set(r.get("model") for r in rows if r.get("model")))
    total_savings_kobo = sum(r.get("savings_kobo", 0) or 0 for r in rows)

    # Previous period for comparison
    prev_logs = (
        db.table("usage_logs")
        .select("cost_kobo")
        .eq("org_id", org_id)
        .eq("is_test", False)
        .gte("created_at", prev_since)
        .lt("created_at", since)
        .limit(5000)
        .execute()
    )
    prev_cost = sum(r.get("cost_kobo", 0) or 0 for r in (prev_logs.data or []))
    spend_change_pct = (
        round(((total_cost_kobo - prev_cost) / prev_cost) * 100, 1) if prev_cost > 0 else None
    )

    # Feature breakdown (aggregate in Python)
    feature_map: dict[str, dict] = {}
    for r in rows:
        tag = r.get("feature_tag") or "untagged"
        if tag not in feature_map:
            feature_map[tag] = {"tag": tag, "calls": 0, "cost_kobo": 0, "savings_kobo": 0}
        feature_map[tag]["calls"] += 1
        feature_map[tag]["cost_kobo"] += r.get("cost_kobo", 0) or 0
        feature_map[tag]["savings_kobo"] += r.get("savings_kobo", 0) or 0
    features = sorted(feature_map.values(), key=lambda x: x["cost_kobo"], reverse=True)
    for f in features:
        f["cost_naira"] = round(f["cost_kobo"] / 100, 2)

    # Model breakdown (aggregate in Python)
    model_map: dict[str, dict] = {}
    for r in rows:
        key = r.get("model", "")
        if key not in model_map:
            model_map[key] = {"model": key, "provider": r.get("provider", ""), "calls": 0, "cost_kobo": 0, "input_tokens": 0, "output_tokens": 0}
        model_map[key]["calls"] += 1
        model_map[key]["cost_kobo"] += r.get("cost_kobo", 0) or 0
        model_map[key]["input_tokens"] += r.get("input_tokens", 0) or 0
        model_map[key]["output_tokens"] += r.get("output_tokens", 0) or 0
    models = sorted(model_map.values(), key=lambda x: x["cost_kobo"], reverse=True)
    for m in models:
        m["cost_naira"] = round(m["cost_kobo"] / 100, 2)

    # Recent routing events
    recent_routes = [
        {
            "request_id": r.get("request_id", ""),
            "routed_from": r.get("routed_from"),
            "routed_to": r.get("routed_to") or r.get("model", ""),
            "reason": r.get("routing_reason"),
            "savings_kobo": r.get("savings_kobo", 0),
            "created_at": r.get("created_at", ""),
        }
        for r in rows
        if r.get("routed_from")
    ][:10]

    return DashboardStats(
        total_spend_naira=round(total_cost_kobo / 100, 2),
        total_spend_kobo=total_cost_kobo,
        total_calls=total_calls,
        active_models=active_models,
        savings_naira=round(total_savings_kobo / 100, 2),
        savings_kobo=total_savings_kobo,
        spend_change_pct=spend_change_pct,
        features=features,
        models=models,
        recent_routes=recent_routes,
    )


@router.get("/stats/usage")
async def usage_timeseries(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
    model: str | None = None,
    tag: str | None = None,
    group_by: str = Query("day", pattern="^(day|hour|model|tag)$"),
):
    """Time-series usage data, filterable by model and tag."""
    org_id = user.org_id
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Fetch raw logs and aggregate in Python
    query = (
        db.table("usage_logs")
        .select("model, feature_tag, cost_kobo, input_tokens, output_tokens, created_at")
        .eq("org_id", org_id)
        .eq("is_test", False)
        .gte("created_at", since)
        .order("created_at")
        .limit(5000)
    )
    if model:
        query = query.eq("model", model)
    if tag:
        query = query.eq("feature_tag", tag)
    result = query.execute()
    rows = result.data or []

    # Group by date (and optionally model/tag)
    grouped: dict[str, dict] = {}
    for r in rows:
        date_str = (r.get("created_at", "") or "")[:10]  # YYYY-MM-DD
        if group_by == "model":
            key = f"{date_str}|{r.get('model', '')}"
        elif group_by == "tag":
            key = f"{date_str}|{r.get('feature_tag', '')}"
        else:
            key = date_str

        if key not in grouped:
            entry = {"date": date_str, "calls": 0, "cost_kobo": 0, "input_tokens": 0, "output_tokens": 0}
            if group_by == "model":
                entry["model"] = r.get("model", "")
            elif group_by == "tag":
                entry["tag"] = r.get("feature_tag", "")
            grouped[key] = entry

        grouped[key]["calls"] += 1
        grouped[key]["cost_kobo"] += r.get("cost_kobo", 0) or 0
        grouped[key]["input_tokens"] += r.get("input_tokens", 0) or 0
        grouped[key]["output_tokens"] += r.get("output_tokens", 0) or 0

    data = sorted(grouped.values(), key=lambda x: x["date"])
    for entry in data:
        entry["cost_naira"] = round(entry["cost_kobo"] / 100, 2)

    return {"data": data, "period_days": days, "group_by": group_by}


@router.get("/recommendations", response_model=list[RecommendationOut])
async def list_recommendations(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("recommendations")
        .select("*")
        .eq("org_id", user.org_id)
        .order("savings_kobo", desc=True)
        .execute()
    )
    return [
        RecommendationOut(
            id=r["id"],
            type=r["type"],
            title=r["title"],
            description=r["description"],
            savings_naira=round(r["savings_kobo"] / 100, 2),
            savings_kobo=r["savings_kobo"],
            impact=r["impact"],
            status=r["status"],
            created_at=r["created_at"],
        )
        for r in (result.data or [])
    ]


@router.get("/agents")
async def list_agents(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("agents")
        .select("*")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .execute()
    )
    return [
        {
            "id": a["id"],
            "name": a["name"],
            "status": a["status"],
            "models": json.loads(a["models"]) if isinstance(a.get("models"), str) else (a.get("models") or []),
            "config": json.loads(a["config"]) if isinstance(a.get("config"), str) else (a.get("config") or {}),
            "created_at": a.get("created_at", ""),
            "updated_at": a.get("updated_at"),
        }
        for a in (result.data or [])
    ]


@router.get("/wallet")
async def dashboard_wallet(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Wallet summary for dashboard header."""
    result = (
        db.table("wallets")
        .select("*")
        .eq("org_id", user.org_id)
        .eq("currency", "NGN")
        .limit(1)
        .execute()
    )
    if not result.data:
        return {"balance_naira": 0, "balance_kobo": 0, "currency": "NGN"}

    wallet = result.data[0]
    return {
        "balance_naira": round(wallet["balance_kobo"] / 100, 2),
        "balance_kobo": wallet["balance_kobo"],
        "currency": wallet["currency"],
    }


@router.get("/wallet/transactions")
async def wallet_transactions(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """Paginated wallet transactions."""
    result = (
        db.table("wallet_transactions")
        .select("*")
        .eq("org_id", user.org_id)
        .order("created_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    txns = result.data or []

    return [
        {
            "id": t["id"],
            "type": t["type"],
            "amount_kobo": t["amount_kobo"],
            "amount_naira": round(t["amount_kobo"] / 100, 2),
            "balance_after_kobo": t["balance_after_kobo"],
            "balance_after_naira": round(t["balance_after_kobo"] / 100, 2),
            "description": t["description"],
            "reference": t.get("reference"),
            "created_at": t.get("created_at", ""),
        }
        for t in txns
    ]


@router.get("/invoices")
async def list_invoices(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """List all invoices for the org."""
    result = (
        db.table("invoices")
        .select("*")
        .eq("org_id", user.org_id)
        .order("period_end", desc=True)
        .execute()
    )
    return [
        {
            "id": inv["id"],
            "period_start": inv.get("period_start", ""),
            "period_end": inv.get("period_end", ""),
            "total_cost_kobo": inv["total_cost_kobo"],
            "total_cost_naira": round(inv["total_cost_kobo"] / 100, 2),
            "total_calls": inv["total_calls"],
            "currency": inv.get("currency", "NGN"),
            "status": inv.get("status", "paid"),
            "created_at": inv.get("created_at", ""),
        }
        for inv in (result.data or [])
    ]


@router.get("/stats/departments")
async def department_breakdown(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Cost breakdown by agent_tag (department/team/module)."""
    org_id = user.org_id
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    try:
        rows = (
            db.table("usage_logs")
            .select("agent_tag, cost_kobo, savings_kobo, input_tokens, output_tokens")
            .eq("org_id", org_id)
            .eq("is_test", False)
            .gte("created_at", since)
            .limit(5000)
            .execute()
        ).data or []
    except Exception:
        # agent_tag column may not exist yet
        rows = (
            db.table("usage_logs")
            .select("feature_tag, cost_kobo, savings_kobo, input_tokens, output_tokens")
            .eq("org_id", org_id)
            .eq("is_test", False)
            .gte("created_at", since)
            .limit(5000)
            .execute()
        ).data or []

    tag_map: dict[str, dict] = {}
    for r in rows:
        tag = r.get("agent_tag") or r.get("feature_tag") or "untagged"
        if tag not in tag_map:
            tag_map[tag] = {"agent_tag": tag, "calls": 0, "cost_kobo": 0, "savings_kobo": 0, "input_tokens": 0, "output_tokens": 0}
        tag_map[tag]["calls"] += 1
        tag_map[tag]["cost_kobo"] += r.get("cost_kobo", 0) or 0
        tag_map[tag]["savings_kobo"] += r.get("savings_kobo", 0) or 0
        tag_map[tag]["input_tokens"] += r.get("input_tokens", 0) or 0
        tag_map[tag]["output_tokens"] += r.get("output_tokens", 0) or 0

    result = sorted(tag_map.values(), key=lambda x: x["cost_kobo"], reverse=True)
    for item in result:
        item["cost_naira"] = round(item["cost_kobo"] / 100, 2)
    return result


# ── Token Bundles ────────────────────────────────────────────────────────


@router.get("/bundles")
async def list_bundles(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """List all token bundles for the org."""
    try:
        from backend.billing.bundles import list_bundles as _list_bundles
        bundles = _list_bundles(db, user.org_id)
    except Exception:
        # token_bundles table may not exist yet
        return []
    return [
        {
            "id": b["id"],
            "name": b["name"],
            "total_tokens": b["total_tokens"],
            "remaining_tokens": b["remaining_tokens"],
            "price_kobo": b["price_kobo"],
            "price_naira": round(b["price_kobo"] / 100, 2),
            "rate_per_million_kobo": b["rate_per_million_kobo"],
            "rate_per_million_naira": round(b["rate_per_million_kobo"] / 100, 2),
            "status": b["status"],
            "purchased_at": b.get("purchased_at", b.get("created_at", "")),
            "expires_at": b.get("expires_at"),
        }
        for b in bundles
    ]


@router.get("/bundles/packages")
async def bundle_packages():
    """List available token bundle packages for purchase."""
    from backend.billing.bundles import get_bundle_packages
    return get_bundle_packages()


@router.post("/bundles/purchase")
async def purchase_bundle(
    body: PurchaseBundleRequest,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Purchase a token bundle (debits wallet)."""
    from backend.billing.bundles import purchase_bundle as _purchase
    from backend.billing.wallet import InsufficientBalanceError

    try:
        bundle = _purchase(db, user.org_id, body.package_id)
    except InsufficientBalanceError:
        raise HTTPException(
            status_code=402,
            detail="Insufficient wallet balance to purchase this bundle.",
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "id": bundle["id"],
        "name": bundle["name"],
        "total_tokens": bundle["total_tokens"],
        "remaining_tokens": bundle["remaining_tokens"],
        "price_kobo": bundle["price_kobo"],
        "price_naira": round(bundle["price_kobo"] / 100, 2),
        "status": bundle["status"],
    }


class RecommendationStatusUpdate(BaseModel):
    status: str  # "applied" | "dismissed" | "pending"


@router.patch("/recommendations/{rec_id}")
async def update_recommendation(
    rec_id: str,
    body: RecommendationStatusUpdate,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    """Update recommendation status (apply/dismiss/restore)."""
    if body.status not in ("applied", "dismissed", "pending"):
        raise HTTPException(status_code=400, detail="Invalid status")

    # Fetch to verify ownership
    result = (
        db.table("recommendations")
        .select("*")
        .eq("id", rec_id)
        .eq("org_id", user.org_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    # Update
    db.table("recommendations").update({"status": body.status}).eq("id", rec_id).execute()

    # Fetch updated
    updated = (
        db.table("recommendations")
        .select("*")
        .eq("id", rec_id)
        .limit(1)
        .execute()
    )
    rec = updated.data[0]

    return RecommendationOut(
        id=rec["id"],
        type=rec["type"],
        title=rec["title"],
        description=rec["description"],
        savings_naira=round(rec["savings_kobo"] / 100, 2),
        savings_kobo=rec["savings_kobo"],
        impact=rec["impact"],
        status=rec["status"],
        created_at=rec["created_at"],
    )
