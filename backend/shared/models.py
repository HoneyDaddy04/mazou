"""SQLAlchemy ORM models for Mazou backend.

NOTE: These models are kept as documentation/reference only.
The backend now uses supabase-py PostgREST client for all queries.
The table schemas defined here match the Supabase PostgreSQL tables.
"""

import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Local Base class (not used for queries, only for model reference)."""
    pass


def _uuid() -> str:
    return str(uuid.uuid4())


# ── Organizations ──────────────────────────────────────────────────────────


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    slug: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    plan: Mapped[str] = mapped_column(String, default="free")  # free | growth | enterprise
    status: Mapped[str] = mapped_column(String, default="active")  # active | suspended
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profiles: Mapped[list["Profile"]] = relationship(back_populates="org")
    api_keys: Mapped[list["ApiKey"]] = relationship(back_populates="org")
    byok_keys: Mapped[list["ByokKey"]] = relationship(back_populates="org")
    wallets: Mapped[list["Wallet"]] = relationship(back_populates="org")
    usage_logs: Mapped[list["UsageLog"]] = relationship(back_populates="org")
    agents: Mapped[list["Agent"]] = relationship(back_populates="org")
    routing_rules: Mapped[list["RoutingRule"]] = relationship(back_populates="org")
    recommendations: Mapped[list["Recommendation"]] = relationship(back_populates="org")


# ── Profiles (Users) ──────────────────────────────────────────────────────


class Profile(Base):
    __tablename__ = "profiles"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    supabase_uid: Mapped[str | None] = mapped_column(String, unique=True, nullable=True)  # auth.users.id
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    full_name: Mapped[str | None] = mapped_column(String, nullable=True)
    role: Mapped[str] = mapped_column(String, default="owner")  # owner | admin | member | viewer
    is_superadmin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="profiles")
    api_keys: Mapped[list["ApiKey"]] = relationship(back_populates="creator")


# ── API Keys ──────────────────────────────────────────────────────────────


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    key_prefix: Mapped[str] = mapped_column(String, nullable=False)  # e.g. mz_live_a3f8
    key_hash: Mapped[str] = mapped_column(String, nullable=False, index=True)  # SHA-256
    environment: Mapped[str] = mapped_column(String, default="live")  # live | test
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_calls: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="active")  # active | revoked
    rate_limit_rpm: Mapped[int] = mapped_column(Integer, default=600)  # requests per minute
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    created_by: Mapped[str] = mapped_column(ForeignKey("profiles.id"), nullable=False)

    org: Mapped["Organization"] = relationship(back_populates="api_keys")
    creator: Mapped["Profile"] = relationship(back_populates="api_keys")
    usage_logs: Mapped[list["UsageLog"]] = relationship(back_populates="api_key")


# ── BYOK Keys ────────────────────────────────────────────────────────────


class ByokKey(Base):
    __tablename__ = "byok_keys"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)  # openai | anthropic | google | ...
    key_encrypted: Mapped[str] = mapped_column(String, nullable=False)  # AES-256-GCM encrypted
    label: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="connected")  # connected | disconnected | error
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="byok_keys")


# ── Wallets ──────────────────────────────────────────────────────────────


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    currency: Mapped[str] = mapped_column(String, default="NGN")
    balance_kobo: Mapped[int] = mapped_column(BigInteger, default=0)  # 100 kobo = ₦1
    auto_fund_threshold_kobo: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    auto_fund_amount_kobo: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="wallets")
    transactions: Mapped[list["WalletTransaction"]] = relationship(back_populates="wallet")


# ── Wallet Transactions ──────────────────────────────────────────────────


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    wallet_id: Mapped[str] = mapped_column(ForeignKey("wallets.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # credit | debit
    amount_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    balance_after_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)  # running balance for audit
    description: Mapped[str] = mapped_column(String, nullable=False)
    reference: Mapped[str | None] = mapped_column(String, nullable=True)
    paystack_ref: Mapped[str | None] = mapped_column(String, nullable=True)
    idempotency_key: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    wallet: Mapped["Wallet"] = relationship(back_populates="transactions")


# ── Usage Logs ───────────────────────────────────────────────────────────


class UsageLog(Base):
    __tablename__ = "usage_logs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    api_key_id: Mapped[str] = mapped_column(ForeignKey("api_keys.id"), nullable=False)
    request_id: Mapped[str] = mapped_column(String, nullable=False, default=_uuid)  # unique per API call
    model: Mapped[str] = mapped_column(String, nullable=False)
    provider: Mapped[str] = mapped_column(String, nullable=False)
    feature_tag: Mapped[str | None] = mapped_column(String, nullable=True)
    agent_id: Mapped[str | None] = mapped_column(String, nullable=True)
    input_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    output_tokens: Mapped[int] = mapped_column(Integer, nullable=False)
    cost_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)  # integer, not float!
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    routed_from: Mapped[str | None] = mapped_column(String, nullable=True)
    routed_to: Mapped[str | None] = mapped_column(String, nullable=True)
    routing_reason: Mapped[str | None] = mapped_column(String, nullable=True)
    savings_kobo: Mapped[int] = mapped_column(BigInteger, default=0)
    cached: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(String, default="success")  # success | error | timeout
    is_test: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="usage_logs")
    api_key: Mapped["ApiKey"] = relationship(back_populates="usage_logs")

    __table_args__ = (
        Index("ix_usage_org_created", "org_id", "created_at"),
        Index("ix_usage_org_model", "org_id", "model"),
        Index("ix_usage_org_tag", "org_id", "feature_tag"),
    )


# ── Agents ───────────────────────────────────────────────────────────────


class Agent(Base):
    __tablename__ = "agents"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, default="idle")  # live | idle | stopped
    models: Mapped[str] = mapped_column(Text, default="[]")  # JSON array string
    config: Mapped[str] = mapped_column(Text, default="{}")  # JSON string
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="agents")


# ── Routing Rules ────────────────────────────────────────────────────────


class RoutingRule(Base):
    __tablename__ = "routing_rules"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    condition: Mapped[str] = mapped_column(Text, default="{}")  # JSON
    action: Mapped[str] = mapped_column(Text, default="{}")  # JSON
    priority: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String, default="active")  # active | paused
    triggers_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="routing_rules")


# ── Recommendations ──────────────────────────────────────────────────────


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # save | swap | cache | batch
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    savings_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    impact: Mapped[str] = mapped_column(String, nullable=False)  # high | medium | low
    status: Mapped[str] = mapped_column(String, default="pending")  # pending | applied | dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    org: Mapped["Organization"] = relationship(back_populates="recommendations")


# ── Invoices ─────────────────────────────────────────────────────────────


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    org_id: Mapped[str] = mapped_column(ForeignKey("organizations.id"), nullable=False)
    period_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    period_end: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_cost_kobo: Mapped[int] = mapped_column(BigInteger, nullable=False)
    total_calls: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String, default="NGN")
    status: Mapped[str] = mapped_column(String, default="paid")  # paid | pending | overdue
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
