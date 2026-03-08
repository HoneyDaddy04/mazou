"""Routing rules CRUD for org-specific routing configuration."""

from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from supabase import Client

from backend.shared.database import get_db
from backend.gateway.middleware.auth import ProfileData, get_current_user
from backend.shared.schemas import RoutingRuleOut, RoutingRuleUpdate

router = APIRouter()


def _rule_to_out(rule: dict) -> RoutingRuleOut:
    condition = json.loads(rule["condition"]) if isinstance(rule.get("condition"), str) else (rule.get("condition") or {})
    action = json.loads(rule["action"]) if isinstance(rule.get("action"), str) else (rule.get("action") or {})
    return RoutingRuleOut(
        id=rule["id"],
        name=rule["name"],
        description=rule.get("description", ""),
        condition=condition,
        action=action,
        priority=rule.get("priority", 0),
        status=rule.get("status", "active"),
        triggers_count=rule.get("triggers_count", 0),
        created_at=rule["created_at"],
    )


@router.get("/rules", response_model=list[RoutingRuleOut])
async def list_rules(
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("routing_rules")
        .select("*")
        .eq("org_id", user.org_id)
        .order("priority", desc=True)
        .execute()
    )
    return [_rule_to_out(r) for r in (result.data or [])]


@router.post("/rules", response_model=RoutingRuleOut)
async def create_rule(
    body: RoutingRuleUpdate,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    if not body.name or not body.condition or not body.action:
        raise HTTPException(status_code=400, detail="name, condition, and action are required")

    rule_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    row = {
        "id": rule_id,
        "org_id": user.org_id,
        "name": body.name,
        "description": body.description or "",
        "condition": json.dumps(body.condition),
        "action": json.dumps(body.action),
        "priority": body.priority or 0,
        "status": body.status or "active",
        "triggers_count": 0,
        "created_at": now,
    }
    db.table("routing_rules").insert(row).execute()

    return _rule_to_out(row)


@router.put("/rules/{rule_id}", response_model=RoutingRuleOut)
async def update_rule(
    rule_id: str,
    body: RoutingRuleUpdate,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("routing_rules")
        .select("*")
        .eq("id", rule_id)
        .eq("org_id", user.org_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Routing rule not found")

    updates = {}
    if body.name is not None:
        updates["name"] = body.name
    if body.description is not None:
        updates["description"] = body.description
    if body.condition is not None:
        updates["condition"] = json.dumps(body.condition)
    if body.action is not None:
        updates["action"] = json.dumps(body.action)
    if body.priority is not None:
        updates["priority"] = body.priority
    if body.status is not None:
        updates["status"] = body.status

    if updates:
        db.table("routing_rules").update(updates).eq("id", rule_id).execute()

    # Fetch updated row
    updated = (
        db.table("routing_rules")
        .select("*")
        .eq("id", rule_id)
        .limit(1)
        .execute()
    )
    return _rule_to_out(updated.data[0])


@router.delete("/rules/{rule_id}")
async def delete_rule(
    rule_id: str,
    user: ProfileData = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    result = (
        db.table("routing_rules")
        .select("id")
        .eq("id", rule_id)
        .eq("org_id", user.org_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Routing rule not found")

    db.table("routing_rules").delete().eq("id", rule_id).execute()
    return {"ok": True, "message": "Rule deleted"}
