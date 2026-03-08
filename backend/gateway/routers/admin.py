"""Admin Portal API -- superadmin-only platform management endpoints."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from supabase import Client

from backend.billing.wallet import credit_wallet, debit_wallet, InsufficientBalanceError
from backend.gateway.middleware.admin_auth import require_superadmin
from backend.shared.config import settings
from backend.shared.database import get_db
from backend.shared.pricing import PROVIDER_KEY_MAP

router = APIRouter(dependencies=[Depends(require_superadmin)])


# ── Pydantic schemas ──────────────────────────────────────────────────────


class PlatformStatsResponse(BaseModel):
    total_orgs: int
    total_users: int
    total_api_keys: int
    total_gmv_kobo: int
    total_provider_cost_kobo: int
    net_revenue_kobo: int
    requests_today: int
    requests_week: int
    requests_month: int


class OrgListItem(BaseModel):
    id: str
    name: str
    slug: str
    plan: str
    status: str
    wallet_balance_kobo: int
    total_spend_kobo: int
    total_calls: int
    created_at: str


class OrgListResponse(BaseModel):
    orgs: list[OrgListItem]
    total: int


class OrgDetailResponse(BaseModel):
    class ProfileItem(BaseModel):
        id: str
        email: str
        full_name: Optional[str]
        role: str
        is_superadmin: bool
        created_at: str

    class ApiKeyItem(BaseModel):
        id: str
        name: str
        key_prefix: str
        environment: str
        status: str
        total_calls: int
        created_at: str

    class WalletItem(BaseModel):
        id: str
        currency: str
        balance_kobo: int

    class UsageLogItem(BaseModel):
        id: str
        model: str
        provider: str
        input_tokens: int
        output_tokens: int
        cost_kobo: int
        latency_ms: int
        status: str
        created_at: str

    id: str
    name: str
    slug: str
    plan: str
    status: str
    created_at: str
    profiles: list[ProfileItem]
    api_keys: list[ApiKeyItem]
    wallets: list[WalletItem]
    recent_usage: list[UsageLogItem]


class StatusUpdate(BaseModel):
    status: str  # active | suspended


class PlanUpdate(BaseModel):
    plan: str  # free | growth | enterprise


class WalletOperation(BaseModel):
    amount_kobo: int
    description: str


class ConfigResponse(BaseModel):
    fx_rate_ngn_usd: int
    managed_margin: float


class ConfigUpdate(BaseModel):
    fx_rate_ngn_usd: Optional[int] = None
    managed_margin: Optional[float] = None


class ProviderStatus(BaseModel):
    name: str
    has_key: bool
    key_prefix: str


class UsageBreakdownItem(BaseModel):
    group: str
    total_requests: int
    total_cost_kobo: int


class PlatformUsageResponse(BaseModel):
    total_requests: int
    total_cost_kobo: int
    breakdown: list[UsageBreakdownItem]


class TopOrgItem(BaseModel):
    org_id: str
    org_name: str
    total_spend_kobo: int
    total_calls: int


# ── Platform stats ────────────────────────────────────────────────────────


@router.get("/stats", response_model=PlatformStatsResponse)
async def get_platform_stats(db: Client = Depends(get_db)):
    """Aggregate platform statistics for the admin dashboard."""
    result = db.rpc("admin_platform_stats", {}).execute()
    row = result.data
    if isinstance(row, list):
        row = row[0] if row else {}

    return PlatformStatsResponse(
        total_orgs=row.get("total_orgs", 0) or 0,
        total_users=row.get("total_users", 0) or 0,
        total_api_keys=row.get("total_api_keys", 0) or 0,
        total_gmv_kobo=row.get("total_gmv_kobo", 0) or 0,
        total_provider_cost_kobo=row.get("total_provider_cost_kobo", 0) or 0,
        net_revenue_kobo=row.get("net_revenue_kobo", 0) or 0,
        requests_today=row.get("requests_today", 0) or 0,
        requests_week=row.get("requests_week", 0) or 0,
        requests_month=row.get("requests_month", 0) or 0,
    )


# ── Org management ────────────────────────────────────────────────────────


@router.get("/orgs", response_model=OrgListResponse)
async def list_orgs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    search: Optional[str] = Query(None),
    db: Client = Depends(get_db),
):
    """List all organizations with pagination and optional search."""
    # Use RPC for the complex join+aggregation query
    result = db.rpc(
        "admin_list_orgs",
        {"p_limit": limit, "p_offset": offset, "p_search": search or ""},
    ).execute()
    data = result.data or []

    # Get total count
    count_result = db.rpc(
        "admin_count_orgs",
        {"p_search": search or ""},
    ).execute()
    count_data = count_result.data
    if isinstance(count_data, list):
        count_data = count_data[0] if count_data else {}
    total = count_data.get("total", 0) if isinstance(count_data, dict) else (count_data or 0)

    items = [
        OrgListItem(
            id=row["id"],
            name=row["name"],
            slug=row["slug"],
            plan=row["plan"],
            status=row["status"],
            wallet_balance_kobo=row.get("wallet_balance_kobo", 0) or 0,
            total_spend_kobo=row.get("total_spend_kobo", 0) or 0,
            total_calls=row.get("total_calls", 0) or 0,
            created_at=row.get("created_at", ""),
        )
        for row in data
    ]

    return OrgListResponse(orgs=items, total=total)


@router.get("/orgs/{org_id}", response_model=OrgDetailResponse)
async def get_org_detail(org_id: str, db: Client = Depends(get_db)):
    """Detailed view of a single organization."""
    # Fetch org
    org_result = (
        db.table("organizations")
        .select("*")
        .eq("id", org_id)
        .limit(1)
        .execute()
    )
    if not org_result.data:
        raise HTTPException(status_code=404, detail="Organization not found")
    org = org_result.data[0]

    # Fetch related data
    profiles_result = db.table("profiles").select("*").eq("org_id", org_id).execute()
    keys_result = db.table("api_keys").select("*").eq("org_id", org_id).execute()
    wallets_result = db.table("wallets").select("*").eq("org_id", org_id).execute()
    usage_result = (
        db.table("usage_logs")
        .select("*")
        .eq("org_id", org_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )

    return OrgDetailResponse(
        id=org["id"],
        name=org["name"],
        slug=org["slug"],
        plan=org["plan"],
        status=org["status"],
        created_at=org.get("created_at", ""),
        profiles=[
            OrgDetailResponse.ProfileItem(
                id=p["id"],
                email=p["email"],
                full_name=p.get("full_name"),
                role=p.get("role", "member"),
                is_superadmin=p.get("is_superadmin", False),
                created_at=p.get("created_at", ""),
            )
            for p in (profiles_result.data or [])
        ],
        api_keys=[
            OrgDetailResponse.ApiKeyItem(
                id=k["id"],
                name=k["name"],
                key_prefix=k["key_prefix"],
                environment=k["environment"],
                status=k["status"],
                total_calls=k.get("total_calls", 0),
                created_at=k.get("created_at", ""),
            )
            for k in (keys_result.data or [])
        ],
        wallets=[
            OrgDetailResponse.WalletItem(
                id=w["id"],
                currency=w["currency"],
                balance_kobo=w["balance_kobo"],
            )
            for w in (wallets_result.data or [])
        ],
        recent_usage=[
            OrgDetailResponse.UsageLogItem(
                id=log["id"],
                model=log["model"],
                provider=log["provider"],
                input_tokens=log["input_tokens"],
                output_tokens=log["output_tokens"],
                cost_kobo=log["cost_kobo"],
                latency_ms=log["latency_ms"],
                status=log.get("status", "success"),
                created_at=log.get("created_at", ""),
            )
            for log in (usage_result.data or [])
        ],
    )


@router.put("/orgs/{org_id}/status")
async def update_org_status(
    org_id: str, body: StatusUpdate, db: Client = Depends(get_db)
):
    """Update organization status (active/suspended)."""
    if body.status not in ("active", "suspended"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'suspended'")

    result = db.table("organizations").select("id").eq("id", org_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Organization not found")

    db.table("organizations").update({"status": body.status}).eq("id", org_id).execute()
    return {"ok": True, "org_id": org_id, "status": body.status}


@router.put("/orgs/{org_id}/plan")
async def update_org_plan(
    org_id: str, body: PlanUpdate, db: Client = Depends(get_db)
):
    """Update organization plan."""
    if body.plan not in ("free", "growth", "enterprise"):
        raise HTTPException(status_code=400, detail="Plan must be 'free', 'growth', or 'enterprise'")

    result = db.table("organizations").select("id").eq("id", org_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Organization not found")

    db.table("organizations").update({"plan": body.plan}).eq("id", org_id).execute()
    return {"ok": True, "org_id": org_id, "plan": body.plan}


# ── Financial operations ──────────────────────────────────────────────────


@router.post("/orgs/{org_id}/wallet/credit")
async def admin_credit_wallet(
    org_id: str, body: WalletOperation, db: Client = Depends(get_db)
):
    """Manual wallet credit by admin."""
    if body.amount_kobo <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        txn = credit_wallet(
            db=db,
            org_id=org_id,
            amount_kobo=body.amount_kobo,
            description=f"[Admin] {body.description}",
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {
        "ok": True,
        "transaction_id": txn["id"],
        "amount_kobo": txn["amount_kobo"],
        "balance_after_kobo": txn["balance_after_kobo"],
    }


@router.post("/orgs/{org_id}/wallet/debit")
async def admin_debit_wallet(
    org_id: str, body: WalletOperation, db: Client = Depends(get_db)
):
    """Manual wallet debit by admin."""
    if body.amount_kobo <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    try:
        txn = debit_wallet(
            db=db,
            org_id=org_id,
            amount_kobo=body.amount_kobo,
            description=f"[Admin] {body.description}",
        )
    except InsufficientBalanceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "ok": True,
        "transaction_id": txn["id"],
        "amount_kobo": txn["amount_kobo"],
        "balance_after_kobo": txn["balance_after_kobo"],
    }


# ── Platform config ───────────────────────────────────────────────────────


@router.get("/config", response_model=ConfigResponse)
async def get_config():
    """Return current platform configuration."""
    return ConfigResponse(
        fx_rate_ngn_usd=settings.fx_rate_ngn_usd,
        managed_margin=settings.managed_margin,
    )


@router.put("/config")
async def update_config(body: ConfigUpdate):
    """Update FX rate and/or margin (runtime only, not persistent)."""
    if body.fx_rate_ngn_usd is not None:
        if body.fx_rate_ngn_usd <= 0:
            raise HTTPException(status_code=400, detail="FX rate must be positive")
        settings.fx_rate_ngn_usd = body.fx_rate_ngn_usd

    if body.managed_margin is not None:
        if body.managed_margin < 0:
            raise HTTPException(status_code=400, detail="Margin cannot be negative")
        settings.managed_margin = body.managed_margin

    return {
        "ok": True,
        "fx_rate_ngn_usd": settings.fx_rate_ngn_usd,
        "managed_margin": settings.managed_margin,
    }


@router.get("/providers", response_model=list[ProviderStatus])
async def get_providers():
    """Provider key status overview."""
    providers = []
    seen = set()
    for provider, attr in PROVIDER_KEY_MAP.items():
        if attr in seen:
            continue
        seen.add(attr)
        key_value = getattr(settings, attr, "")
        has_key = bool(key_value)
        key_prefix = key_value[:8] if has_key else "not set"
        providers.append(ProviderStatus(name=provider, has_key=has_key, key_prefix=key_prefix))
    return providers


# ── Usage monitoring ──────────────────────────────────────────────────────


@router.get("/usage", response_model=PlatformUsageResponse)
async def get_platform_usage(
    days: int = Query(30, ge=1, le=365),
    group_by: str = Query("provider", pattern="^(provider|model)$"),
    db: Client = Depends(get_db),
):
    """Platform-wide usage statistics grouped by provider or model."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    result = db.rpc(
        "admin_platform_usage",
        {"p_since": since, "p_group_by": group_by},
    ).execute()
    data = result.data or []

    # Extract totals and breakdown
    total_requests = 0
    total_cost_kobo = 0
    breakdown = []
    for row in data:
        requests = row.get("total_requests", 0) or 0
        cost = row.get("total_cost_kobo", 0) or 0
        total_requests += requests
        total_cost_kobo += cost
        breakdown.append(
            UsageBreakdownItem(
                group=row.get("group_name", ""),
                total_requests=requests,
                total_cost_kobo=cost,
            )
        )

    return PlatformUsageResponse(
        total_requests=total_requests,
        total_cost_kobo=total_cost_kobo,
        breakdown=breakdown,
    )


@router.get("/usage/top-orgs", response_model=list[TopOrgItem])
async def get_top_orgs(
    days: int = Query(30, ge=1, le=365),
    db: Client = Depends(get_db),
):
    """Top 10 organizations by spend."""
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    result = db.rpc(
        "admin_top_orgs",
        {"p_since": since},
    ).execute()

    return [
        TopOrgItem(
            org_id=row.get("org_id", ""),
            org_name=row.get("org_name", ""),
            total_spend_kobo=row.get("total_spend_kobo", 0) or 0,
            total_calls=row.get("total_calls", 0) or 0,
        )
        for row in (result.data or [])
    ]
