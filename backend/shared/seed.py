"""Seed script: creates demo org, profile, wallet, routing rules, usage logs, transactions, invoices.

The demo user is linked to a Supabase Auth user. Create the user in Supabase first:
  email: demo@mazou.io, password: password123
Then pass the Supabase user's UUID as DEMO_SUPABASE_UID env var (or it will be auto-detected).
"""

import hashlib
import json
import os
import random
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import httpx

from backend.shared.config import settings
from backend.shared.database import get_supabase


# ── Model/provider configs used in seed data ──

MODELS = [
    ("gpt-5", "openai", 1500, 6000),         # input/output cost per 1M tokens in kobo-equivalent
    ("gpt-4.1-mini", "openai", 400, 1600),
    ("claude-sonnet-4.6", "anthropic", 3000, 15000),
    ("claude-haiku-4.5", "anthropic", 800, 4000),
    ("gemini-2.5-flash", "google", 150, 600),
    ("gemini-2.5-pro", "google", 1250, 10000),
]

FEATURE_TAGS = ["support-bot", "fraud-detection", "onboarding", "compliance", "summariser", "translation"]

ROUTING_PAIRS = [
    ("gpt-5", "claude-sonnet-4.6", "budget_optimization"),
    ("gpt-5", "claude-haiku-4.5", "simple_query_downgrade"),
    ("claude-sonnet-4.6", "gemini-2.5-flash", "cost_reduction"),
    ("gpt-5", "gemini-2.5-pro", "latency_fallback"),
]


def _ensure_supabase_demo_user() -> str | None:
    """Create demo@mazou.io in Supabase Auth if it doesn't exist. Returns the UUID."""
    if not settings.supabase_url or not settings.supabase_service_key:
        return os.environ.get("DEMO_SUPABASE_UID")

    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": f"Bearer {settings.supabase_service_key}",
        "Content-Type": "application/json",
    }

    with httpx.Client() as client:
        # Check if user exists
        resp = client.get(
            f"{settings.supabase_url}/auth/v1/admin/users",
            headers=headers,
            params={"page": 1, "per_page": 50},
        )
        if resp.status_code == 200:
            data = resp.json()
            users = data.get("users", data) if isinstance(data, dict) else data
            for u in users:
                if u.get("email") == "demo@mazou.io":
                    return u["id"]

        # Create user
        resp = client.post(
            f"{settings.supabase_url}/auth/v1/admin/users",
            headers=headers,
            json={
                "email": "demo@mazou.io",
                "password": "password123",
                "email_confirm": True,
                "user_metadata": {"full_name": "Demo User", "org_name": "Mazou Demo"},
            },
        )
        if resp.status_code in (200, 201):
            return resp.json()["id"]

        print(f"Warning: Could not create Supabase demo user: {resp.status_code} {resp.text}")
        return os.environ.get("DEMO_SUPABASE_UID")


async def seed():
    """Seed the database via Supabase REST API. Called from lifespan startup."""
    # Get or create the Supabase auth user
    supabase_uid = _ensure_supabase_demo_user()

    db = get_supabase()

    # Check if already seeded
    existing = db.table("organizations").select("id").limit(1).execute()
    if existing.data:
        print("Database already seeded. Skipping.")
        return

    org_id = "org_demo_001"
    profile_id = "profile_demo_001"
    wallet_id = "wallet_demo_001"
    key_id = "key_demo_001"
    now = datetime.now(timezone.utc)

    # ── Organization ──
    db.table("organizations").insert({
        "id": org_id,
        "name": "Mazou Demo",
        "slug": "mazou-demo",
        "plan": "growth",
        "status": "active",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }).execute()

    # ── Profile ──
    db.table("profiles").insert({
        "id": profile_id,
        "org_id": org_id,
        "supabase_uid": supabase_uid,
        "email": "demo@mazou.io",
        "full_name": "Demo User",
        "role": "owner",
        "is_superadmin": False,
        "created_at": now.isoformat(),
    }).execute()

    # ── Wallet ──
    db.table("wallets").insert({
        "id": wallet_id,
        "org_id": org_id,
        "currency": "NGN",
        "balance_kobo": 5_000_000,  # NGN 50,000
        "updated_at": now.isoformat(),
    }).execute()

    # ── API Key ──
    raw_key = f"mz_live_{secrets.token_hex(20)}"
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    db.table("api_keys").insert({
        "id": key_id,
        "org_id": org_id,
        "name": "Production Key",
        "key_prefix": raw_key[:12],
        "key_hash": key_hash,
        "environment": "live",
        "created_by": profile_id,
        "total_calls": 0,
        "status": "active",
        "rate_limit_rpm": 600,
        "created_at": now.isoformat(),
    }).execute()

    # Second API key (test)
    raw_test_key = f"mz_test_{secrets.token_hex(20)}"
    test_key_hash = hashlib.sha256(raw_test_key.encode()).hexdigest()
    db.table("api_keys").insert({
        "id": "key_demo_002",
        "org_id": org_id,
        "name": "Test Key",
        "key_prefix": raw_test_key[:12],
        "key_hash": test_key_hash,
        "environment": "test",
        "created_by": profile_id,
        "total_calls": 0,
        "status": "active",
        "rate_limit_rpm": 600,
        "created_at": now.isoformat(),
    }).execute()

    # ── Routing Rules ──
    rules_data = [
        ("Language Detection",
         "If input is Yoruba/Hausa/Igbo/Pidgin, route to YarnGPT or AfroLM",
         {"language_in": ["yo", "ha", "ig", "pcm"]},
         {"target_model": "yarngpt", "fallback": "inkubalm"},
         10, "active", 1423),
        ("Simple Query Downgrade",
         "If query < 100 tokens and budget=low, route to Haiku 4.5",
         {"budget": "low", "tokens_lt": 100},
         {"target_model": "claude-haiku-4.5"},
         8, "active", 8742),
        ("Budget Low",
         "Budget=low, route to Gemini 2.5 Flash",
         {"budget": "low"},
         {"target_model": "gemini-2.5-flash"},
         7, "active", 12340),
        ("Budget High",
         "Budget=high, route to GPT-5",
         {"budget": "high"},
         {"target_model": "gpt-5"},
         5, "active", 3891),
        ("Latency Fallback",
         "If primary model response > 5s, fallback to next cheapest capable model",
         {"timeout_gt_ms": 5000},
         {"fallback_to": "next_cheapest"},
         2, "active", 567),
        ("Default",
         "Default model for auto routing",
         {"always": True},
         {"target_model": "gpt-5"},
         1, "active", 24120),
    ]
    for name, desc, condition, action, priority, status, triggers in rules_data:
        db.table("routing_rules").insert({
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "name": name,
            "description": desc,
            "condition": json.dumps(condition),
            "action": json.dumps(action),
            "priority": priority,
            "status": status,
            "triggers_count": triggers,
            "created_at": now.isoformat(),
        }).execute()

    # ── Agents ──
    agent_ids = [f"agent_{i:03d}" for i in range(4)]
    agents_data = [
        ("Customer Support Bot", "live", ["gpt-5", "claude-haiku-4.5"], {"budget": "medium", "tag": "support-bot"}),
        ("Fraud Detection Agent", "live", ["gpt-5"], {"budget": "high", "tag": "fraud-detection"}),
        ("Onboarding Assistant", "live", ["claude-sonnet-4.6", "yarngpt"], {"budget": "medium", "tag": "onboarding"}),
        ("Compliance Reviewer", "idle", ["claude-opus-4.6"], {"budget": "unlimited", "tag": "compliance"}),
    ]
    for aid, (name, status, models, config) in zip(agent_ids, agents_data):
        db.table("agents").insert({
            "id": aid,
            "org_id": org_id,
            "name": name,
            "status": status,
            "models": json.dumps(models),
            "config": json.dumps(config),
            "created_at": now.isoformat(),
            "updated_at": now.isoformat(),
        }).execute()

    # ── Recommendations ──
    recs = [
        ("save", "Downgrade Support Bot to Claude Sonnet 4.6",
         "842K calls/mo using GPT-5 for tier-1 support. Sonnet 4.6 handles 96% of these with identical quality scores.",
         89_000_000, "high"),
        ("swap", "Route Summariser to Haiku 4.5 for short inputs",
         "72% of summarisation inputs are under 500 tokens. Haiku 4.5 matches Sonnet quality at this length.",
         24_800_000, "high"),
        ("cache", "Enable response caching for Support Bot",
         "34% of support queries are repeated questions. Caching would eliminate redundant API calls.",
         18_600_000, "medium"),
        ("swap", "Route Hausa tasks to AfroLM",
         "14K Hausa-language calls going to GPT-5. AfroLM scores 40% higher on Hausa benchmarks at 60% the cost.",
         3_800_000, "medium"),
    ]
    for rec_type, title, desc, savings, impact in recs:
        db.table("recommendations").insert({
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "type": rec_type,
            "title": title,
            "description": desc,
            "savings_kobo": savings,
            "impact": impact,
            "status": "pending",
            "created_at": now.isoformat(),
        }).execute()

    # ── Usage Logs (80+ entries over 30 days) ──
    total_usage_calls = 0
    total_usage_cost = 0
    usage_batch = []
    for day_offset in range(30, 0, -1):
        day = now - timedelta(days=day_offset)
        n_logs = random.randint(2, 4)
        for _ in range(n_logs):
            model_name, provider, in_cost, out_cost = random.choice(MODELS)
            tag = random.choice(FEATURE_TAGS)
            agent_id = random.choice(agent_ids + [None])
            input_tok = random.randint(50, 2000)
            output_tok = random.randint(20, 1500)
            cost = int((input_tok * in_cost + output_tok * out_cost) / 1_000_000 * settings.fx_rate_ngn_usd)
            cost = max(cost, 1)
            latency = random.randint(200, 8000)
            cached = random.random() < 0.12

            routed_from = None
            routed_to = None
            routing_reason = None
            savings = 0
            if random.random() < 0.35:
                pair = random.choice(ROUTING_PAIRS)
                routed_from, routed_to, routing_reason = pair
                savings = int(cost * random.uniform(0.15, 0.45))

            hour = random.randint(6, 23)
            minute = random.randint(0, 59)
            created = day.replace(hour=hour, minute=minute, second=random.randint(0, 59))

            usage_batch.append({
                "id": str(uuid.uuid4()),
                "org_id": org_id,
                "api_key_id": key_id,
                "request_id": str(uuid.uuid4()),
                "model": model_name,
                "provider": provider,
                "feature_tag": tag,
                "agent_id": agent_id,
                "input_tokens": input_tok,
                "output_tokens": output_tok,
                "cost_kobo": cost,
                "latency_ms": latency,
                "routed_from": routed_from,
                "routed_to": routed_to,
                "routing_reason": routing_reason,
                "savings_kobo": savings,
                "cached": cached,
                "status": "success",
                "is_test": False,
                "created_at": created.isoformat(),
            })
            total_usage_calls += 1
            total_usage_cost += cost

    # Insert usage logs in batches of 20
    for i in range(0, len(usage_batch), 20):
        batch = usage_batch[i:i + 20]
        db.table("usage_logs").insert(batch).execute()

    # Update API key call count
    db.table("api_keys").update({"total_calls": total_usage_calls}).eq("id", key_id).execute()

    # ── Wallet Transactions ──
    running_balance = 10_000_000  # Start with NGN 100K
    txn_data = [
        ("credit", 10_000_000, "Initial wallet funding via Paystack", now - timedelta(days=32)),
        ("debit", 1_200_000, "API usage charges - Week 1", now - timedelta(days=25)),
        ("debit", 980_000, "API usage charges - Week 2", now - timedelta(days=18)),
        ("credit", 5_000_000, "Top-up via Paystack", now - timedelta(days=15)),
        ("debit", 1_450_000, "API usage charges - Week 3", now - timedelta(days=11)),
        ("debit", 870_000, "API usage charges - Week 4", now - timedelta(days=4)),
        ("credit", 2_000_000, "Top-up via Paystack", now - timedelta(days=2)),
        ("debit", 500_000, "API usage charges - current", now - timedelta(days=1)),
    ]
    for txn_type, amount, desc, created in txn_data:
        if txn_type == "credit":
            running_balance += amount
        else:
            running_balance -= amount
        db.table("wallet_transactions").insert({
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "wallet_id": wallet_id,
            "type": txn_type,
            "amount_kobo": amount,
            "balance_after_kobo": running_balance,
            "description": desc,
            "reference": f"ref_{secrets.token_hex(8)}" if txn_type == "credit" else None,
            "paystack_ref": f"PSK_{secrets.token_hex(10)}" if txn_type == "credit" else None,
            "created_at": created.isoformat(),
        }).execute()

    # Update wallet to match final running balance
    db.table("wallets").update({"balance_kobo": running_balance}).eq("id", wallet_id).execute()

    # ── Invoices (past 3 months) ──
    for m in range(3):
        month_start = (now.replace(day=1) - timedelta(days=30 * (m + 1))).replace(day=1)
        month_end = (month_start + timedelta(days=32)).replace(day=1) - timedelta(seconds=1)
        cost = random.randint(2_000_000, 5_000_000)
        calls = random.randint(8000, 25000)
        db.table("invoices").insert({
            "id": str(uuid.uuid4()),
            "org_id": org_id,
            "period_start": month_start.isoformat(),
            "period_end": month_end.isoformat(),
            "total_cost_kobo": cost,
            "total_calls": calls,
            "currency": "NGN",
            "status": "paid",
            "created_at": (month_end + timedelta(days=1)).isoformat(),
        }).execute()

    print("Seeded successfully!")
    print(f"  Demo API key: {raw_key}")
    print(f"  Test API key: {raw_test_key}")
    print(f"  Demo login: demo@mazou.io / password123")
    print(f"  Supabase UID: {supabase_uid or 'not set'}")
    print(f"  Usage logs: {total_usage_calls} entries over 30 days")
    print(f"  Wallet balance: NGN {running_balance / 100:,.0f} ({running_balance} kobo)")


if __name__ == "__main__":
    import asyncio
    asyncio.run(seed())
