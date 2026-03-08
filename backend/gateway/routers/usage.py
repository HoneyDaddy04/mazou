"""Public usage API: /v1/usage — consumed by API key holders."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from supabase import Client

from backend.shared.database import get_db
from backend.shared.schemas import UsageLogOut
from backend.gateway.middleware.auth import ApiKeyData, validate_api_key

router = APIRouter()


@router.get("/usage")
async def get_usage(
    key_data: ApiKeyData = Depends(validate_api_key),
    db: Client = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
    model: str | None = None,
    tag: str | None = None,
    agent_tag: str | None = None,
    limit: int = Query(100, ge=1, le=1000),
):
    """Get usage logs for the authenticated org."""
    org_id = key_data.org.id
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    query = (
        db.table("usage_logs")
        .select("*")
        .eq("org_id", org_id)
        .gte("created_at", since)
        .order("created_at", desc=True)
        .limit(limit)
    )
    if model:
        query = query.eq("model", model)
    if tag:
        query = query.eq("feature_tag", tag)
    if agent_tag:
        query = query.eq("agent_tag", agent_tag)

    result = query.execute()
    logs = result.data or []

    return {
        "data": [
            UsageLogOut(
                id=l["id"],
                model=l["model"],
                provider=l["provider"],
                feature_tag=l.get("feature_tag"),
                agent_tag=l.get("agent_tag"),
                input_tokens=l["input_tokens"],
                output_tokens=l["output_tokens"],
                cost_naira=round(l["cost_kobo"] / 100, 4),
                cost_kobo=l["cost_kobo"],
                latency_ms=l["latency_ms"],
                routed_from=l.get("routed_from"),
                routed_to=l.get("routed_to"),
                routing_reason=l.get("routing_reason"),
                savings_naira=round((l.get("savings_kobo", 0) or 0) / 100, 4),
                cached=l.get("cached", False),
                bundle_id=l.get("bundle_id"),
                created_at=l["created_at"],
            ).model_dump()
            for l in logs
        ],
        "count": len(logs),
        "period_days": days,
    }


@router.get("/usage/departments")
async def usage_by_department(
    key_data: ApiKeyData = Depends(validate_api_key),
    db: Client = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Usage breakdown by agent_tag (department/team). Programmatic API."""
    org_id = key_data.org.id
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    rows = (
        db.table("usage_logs")
        .select("agent_tag, cost_kobo, input_tokens, output_tokens")
        .eq("org_id", org_id)
        .eq("is_test", False)
        .gte("created_at", since)
        .limit(5000)
        .execute()
    ).data or []

    tag_map: dict[str, dict] = {}
    for r in rows:
        tag = r.get("agent_tag") or "untagged"
        if tag not in tag_map:
            tag_map[tag] = {"agent_tag": tag, "calls": 0, "cost_kobo": 0, "input_tokens": 0, "output_tokens": 0}
        tag_map[tag]["calls"] += 1
        tag_map[tag]["cost_kobo"] += r.get("cost_kobo", 0) or 0
        tag_map[tag]["input_tokens"] += r.get("input_tokens", 0) or 0
        tag_map[tag]["output_tokens"] += r.get("output_tokens", 0) or 0

    result = sorted(tag_map.values(), key=lambda x: x["cost_kobo"], reverse=True)
    for item in result:
        item["cost_naira"] = round(item["cost_kobo"] / 100, 2)

    return {"data": result, "period_days": days}


@router.get("/usage/summary")
async def usage_summary(
    key_data: ApiKeyData = Depends(validate_api_key),
    db: Client = Depends(get_db),
    days: int = Query(30, ge=1, le=365),
):
    """Aggregated usage summary for the authenticated org."""
    org_id = key_data.org.id
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    rows = (
        db.table("usage_logs")
        .select("model, cost_kobo, savings_kobo, input_tokens, output_tokens, latency_ms")
        .eq("org_id", org_id)
        .eq("is_test", False)
        .gte("created_at", since)
        .limit(5000)
        .execute()
    ).data or []

    total_cost_kobo = sum(r.get("cost_kobo", 0) or 0 for r in rows)
    total_savings_kobo = sum(r.get("savings_kobo", 0) or 0 for r in rows)
    total_input_tokens = sum(r.get("input_tokens", 0) or 0 for r in rows)
    total_output_tokens = sum(r.get("output_tokens", 0) or 0 for r in rows)
    avg_latency = sum(r.get("latency_ms", 0) or 0 for r in rows) / max(len(rows), 1)

    # Per-model breakdown
    model_map: dict[str, dict] = {}
    for r in rows:
        m = r.get("model", "")
        if m not in model_map:
            model_map[m] = {"model": m, "calls": 0, "cost_kobo": 0}
        model_map[m]["calls"] += 1
        model_map[m]["cost_kobo"] += r.get("cost_kobo", 0) or 0
    by_model = sorted(model_map.values(), key=lambda x: x["cost_kobo"], reverse=True)
    for item in by_model:
        item["cost_naira"] = round(item["cost_kobo"] / 100, 2)

    return {
        "total_calls": len(rows),
        "total_cost_kobo": total_cost_kobo,
        "total_cost_naira": round(total_cost_kobo / 100, 2),
        "total_savings_kobo": total_savings_kobo,
        "total_savings_naira": round(total_savings_kobo / 100, 2),
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "avg_latency_ms": round(avg_latency),
        "period_days": days,
        "by_model": by_model,
    }
