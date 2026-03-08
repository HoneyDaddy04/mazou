"""Tests for /api/dashboard/* endpoints: stats, usage, recommendations, agents, wallet."""

import json
import uuid
from datetime import datetime

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.shared.models import Agent, Recommendation, UsageLog
from backend.tests.conftest import _test_session_factory


pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _seed_usage_log(org_id: str, api_key_id: str, **overrides):
    """Insert a usage log for dashboard aggregation tests."""
    async with _test_session_factory() as db:
        log = UsageLog(
            id=str(uuid.uuid4()),
            org_id=org_id,
            api_key_id=api_key_id,
            request_id=str(uuid.uuid4()),
            model=overrides.get("model", "gpt-4o-mini"),
            provider=overrides.get("provider", "openai"),
            input_tokens=overrides.get("input_tokens", 100),
            output_tokens=overrides.get("output_tokens", 50),
            cost_kobo=overrides.get("cost_kobo", 500),
            latency_ms=overrides.get("latency_ms", 200),
            feature_tag=overrides.get("feature_tag", None),
            savings_kobo=overrides.get("savings_kobo", 0),
            is_test=overrides.get("is_test", False),
            status=overrides.get("status", "success"),
            created_at=overrides.get("created_at", datetime.utcnow()),
        )
        db.add(log)
        await db.commit()


class TestDashboardStats:
    async def test_stats_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_calls"] == 0
        assert data["total_spend_kobo"] == 0
        assert data["total_spend_naira"] == 0.0

    async def test_stats_with_usage(self, auth_client: AsyncClient):
        org = auth_client._test_org  # type: ignore[attr-defined]
        # Create an API key
        create_resp = await auth_client.post("/v1/keys", json={"name": "DashKey", "environment": "live"})
        api_key_id = create_resp.json()["id"]

        await _seed_usage_log(org.id, api_key_id, cost_kobo=1000)
        await _seed_usage_log(org.id, api_key_id, cost_kobo=2000)

        resp = await auth_client.get("/api/dashboard/stats")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_calls"] == 2
        assert data["total_spend_kobo"] == 3000

    async def test_stats_with_days_param(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/stats?days=7")
        assert resp.status_code == 200

    async def test_stats_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/stats")
        assert resp.status_code == 401


class TestStatsUsage:
    async def test_usage_timeseries_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/stats/usage")
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"] == []
        assert data["period_days"] == 30
        assert data["group_by"] == "day"

    async def test_usage_timeseries_with_group_by(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/stats/usage?group_by=model")
        assert resp.status_code == 200
        assert resp.json()["group_by"] == "model"

    async def test_usage_timeseries_invalid_group_by(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/stats/usage?group_by=invalid")
        assert resp.status_code == 422

    async def test_usage_timeseries_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/stats/usage")
        assert resp.status_code == 401


class TestRecommendations:
    async def test_recommendations_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/recommendations")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_recommendations_with_data(self, auth_client: AsyncClient):
        org = auth_client._test_org  # type: ignore[attr-defined]
        async with _test_session_factory() as db:
            rec = Recommendation(
                id=str(uuid.uuid4()),
                org_id=org.id,
                type="swap",
                title="Switch to Gemini Flash",
                description="Save 40% by using Gemini 2.5 Flash for simple queries",
                savings_kobo=50000,
                impact="high",
                status="pending",
            )
            db.add(rec)
            await db.commit()

        resp = await auth_client.get("/api/dashboard/recommendations")
        assert resp.status_code == 200
        recs = resp.json()
        assert len(recs) >= 1
        found = [r for r in recs if r["title"] == "Switch to Gemini Flash"]
        assert len(found) == 1
        assert found[0]["savings_kobo"] == 50000
        assert found[0]["savings_naira"] == 500.0

    async def test_recommendations_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/recommendations")
        assert resp.status_code == 401


class TestAgents:
    async def test_agents_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/agents")
        assert resp.status_code == 200
        # May have agents from other tests, just check it's a list
        assert isinstance(resp.json(), list)

    async def test_agents_with_data(self, auth_client: AsyncClient):
        org = auth_client._test_org  # type: ignore[attr-defined]
        agent_name = f"Bot-{uuid.uuid4().hex[:6]}"
        async with _test_session_factory() as db:
            agent = Agent(
                id=str(uuid.uuid4()),
                org_id=org.id,
                name=agent_name,
                status="live",
                models=json.dumps(["gpt-4o-mini", "claude-haiku-4.5"]),
                config=json.dumps({"max_tokens": 1000}),
            )
            db.add(agent)
            await db.commit()

        resp = await auth_client.get("/api/dashboard/agents")
        assert resp.status_code == 200
        agents = resp.json()
        found = [a for a in agents if a["name"] == agent_name]
        assert len(found) == 1
        assert found[0]["status"] == "live"
        assert isinstance(found[0]["models"], list)

    async def test_agents_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/agents")
        assert resp.status_code == 401


class TestDashboardWallet:
    async def test_dashboard_wallet(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/dashboard/wallet")
        assert resp.status_code == 200
        data = resp.json()
        assert data["currency"] == "NGN"
        assert data["balance_kobo"] == 1_000_000
        assert data["balance_naira"] == 10_000.0

    async def test_dashboard_wallet_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/dashboard/wallet")
        assert resp.status_code == 401
