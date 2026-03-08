"""Pydantic v2 schemas for request/response validation."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Auth ─────────────────────────────────────────────────────────────────


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1)
    org_name: str = Field(min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    full_name: str | None
    role: str
    org_id: str
    org_name: str
    org_slug: str
    org_plan: str


# ── API Keys ─────────────────────────────────────────────────────────────


class CreateKeyRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    environment: str = Field(default="live", pattern="^(live|test)$")


class ApiKeyOut(BaseModel):
    id: str
    name: str
    key_prefix: str
    environment: str
    status: str
    total_calls: int
    last_used_at: datetime | None
    created_at: datetime


class ApiKeyCreated(ApiKeyOut):
    """Returned only on creation — includes the full key."""
    key: str  # Full key, shown once


# ── Wallet ───────────────────────────────────────────────────────────────


class WalletOut(BaseModel):
    id: str
    currency: str
    balance_naira: float  # balance_kobo / 100 for display
    balance_kobo: int
    auto_fund_threshold_naira: float | None = None
    auto_fund_amount_naira: float | None = None


class TopupRequest(BaseModel):
    amount_naira: float = Field(gt=0, description="Amount in Naira")
    callback_url: str | None = None


class TransactionOut(BaseModel):
    id: str
    type: str  # credit | debit
    amount_naira: float
    amount_kobo: int
    balance_after_naira: float
    description: str
    reference: str | None
    created_at: datetime


# ── Chat Completions ─────────────────────────────────────────────────────


class MazuExtensions(BaseModel):
    """Mazou-specific fields in the chat completions request."""
    budget: str | None = Field(None, pattern="^(low|medium|high|unlimited)$")
    tag: str | None = None  # feature tag for cost tracking
    agent_tag: str | None = None  # agent tag
    preferred_providers: list[str] | None = None
    language_hint: str | None = None
    fallback: str | None = None


class ChatMessage(BaseModel):
    role: str
    content: str | list


class ChatCompletionRequest(BaseModel):
    model: str = "auto"
    messages: list[ChatMessage]
    max_tokens: int | None = None
    temperature: float | None = None
    top_p: float | None = None
    stream: bool = False
    n: int | None = None
    stop: str | list[str] | None = None
    # Mazou extensions (also accept flat fields for convenience)
    mazu: MazuExtensions | None = None
    tag: str | None = None  # shorthand for mazu.tag
    budget: str | None = None  # shorthand for mazu.budget
    agent_tag: str | None = None  # shorthand for mazu.agent_tag (department/team)


# ── Dashboard ────────────────────────────────────────────────────────────


class DashboardStats(BaseModel):
    total_spend_naira: float
    total_spend_kobo: int
    total_calls: int
    active_models: int
    savings_naira: float
    savings_kobo: int
    spend_change_pct: float | None = None
    features: list[dict]
    models: list[dict]
    recent_routes: list[dict]


# ── Usage ────────────────────────────────────────────────────────────────


class UsageLogOut(BaseModel):
    id: str
    model: str
    provider: str
    feature_tag: str | None
    agent_tag: str | None
    input_tokens: int
    output_tokens: int
    cost_naira: float
    cost_kobo: int
    latency_ms: int
    routed_from: str | None
    routed_to: str | None
    routing_reason: str | None
    savings_naira: float
    cached: bool
    bundle_id: str | None = None
    created_at: datetime


# ── Models Catalogue ─────────────────────────────────────────────────────


class CatalogModelOut(BaseModel):
    id: str
    name: str
    provider: str
    category: str
    tags: list[str]
    description: str
    context_window: str
    input_cost_usd: float  # per 1M tokens
    output_cost_usd: float
    is_african: bool
    african_meta: dict | None = None
    released: str


# ── Routing Rules ────────────────────────────────────────────────────────


class RoutingRuleOut(BaseModel):
    id: str
    name: str
    description: str
    condition: dict
    action: dict
    priority: int
    status: str
    triggers_count: int
    created_at: datetime


class RoutingRuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    condition: dict | None = None
    action: dict | None = None
    priority: int | None = None
    status: str | None = Field(None, pattern="^(active|paused)$")


# ── BYOK Keys ───────────────────────────────────────────────────────────


class ByokKeyCreate(BaseModel):
    provider: str = Field(pattern="^(openai|anthropic|google|deepseek|mistral)$")
    label: str = Field(min_length=1, max_length=100)
    api_key: str = Field(min_length=1)


class ByokKeyOut(BaseModel):
    id: str
    provider: str
    label: str
    status: str
    created_at: datetime


# ── Recommendations ──────────────────────────────────────────────────────


# ── Token Bundles ───────────────────────────────────────────────────────


class TokenBundleOut(BaseModel):
    id: str
    name: str
    total_tokens: int
    remaining_tokens: int
    price_naira: float
    price_kobo: int
    rate_per_million_naira: float
    rate_per_million_kobo: int
    status: str
    purchased_at: datetime
    expires_at: datetime | None = None


class PurchaseBundleRequest(BaseModel):
    package_id: str


# ── Recommendations ──────────────────────────────────────────────────────


class RecommendationOut(BaseModel):
    id: str
    type: str
    title: str
    description: str
    savings_naira: float
    savings_kobo: int
    impact: str
    status: str
    created_at: datetime
