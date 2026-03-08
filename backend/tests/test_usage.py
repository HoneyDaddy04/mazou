"""Tests for /v1/usage and /v1/usage/summary — API-key authenticated."""

import uuid
from datetime import datetime

import pytest
from httpx import AsyncClient

from backend.shared.models import UsageLog
from backend.tests.conftest import _test_session_factory


pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _seed_usage(org_id: str, api_key_id: str, count: int = 3):
    """Insert multiple usage logs."""
    async with _test_session_factory() as db:
        for i in range(count):
            log = UsageLog(
                id=str(uuid.uuid4()),
                org_id=org_id,
                api_key_id=api_key_id,
                request_id=str(uuid.uuid4()),
                model="gpt-4o-mini",
                provider="openai",
                input_tokens=100 + i * 10,
                output_tokens=50 + i * 5,
                cost_kobo=500 + i * 100,
                latency_ms=200 + i * 50,
                is_test=False,
                status="success",
                created_at=datetime.utcnow(),
            )
            db.add(log)
        await db.commit()


class TestUsage:
    async def test_usage_empty(self, api_key_client: AsyncClient):
        resp = await api_key_client.get("/v1/usage")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 0
        assert data["period_days"] == 30

    async def test_usage_with_data(self, api_key_client: AsyncClient):
        org = api_key_client._test_org  # type: ignore[attr-defined]
        api_key = api_key_client._test_api_key  # type: ignore[attr-defined]

        await _seed_usage(org.id, api_key.id, count=5)

        resp = await api_key_client.get("/v1/usage")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 5
        assert len(data["data"]) == 5
        entry = data["data"][0]
        assert "model" in entry
        assert "cost_kobo" in entry
        assert "cost_naira" in entry
        assert "latency_ms" in entry

    async def test_usage_with_limit(self, api_key_client: AsyncClient):
        org = api_key_client._test_org  # type: ignore[attr-defined]
        api_key = api_key_client._test_api_key  # type: ignore[attr-defined]

        await _seed_usage(org.id, api_key.id, count=10)

        resp = await api_key_client.get("/v1/usage?limit=3")
        assert resp.status_code == 200
        assert resp.json()["count"] == 3

    async def test_usage_with_days(self, api_key_client: AsyncClient):
        resp = await api_key_client.get("/v1/usage?days=7")
        assert resp.status_code == 200
        assert resp.json()["period_days"] == 7

    async def test_usage_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/v1/usage")
        assert resp.status_code == 401


class TestUsageSummary:
    async def test_summary_empty(self, api_key_client: AsyncClient):
        resp = await api_key_client.get("/v1/usage/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_calls"] == 0
        assert data["total_cost_kobo"] == 0
        assert data["period_days"] == 30

    async def test_summary_with_data(self, api_key_client: AsyncClient):
        org = api_key_client._test_org  # type: ignore[attr-defined]
        api_key = api_key_client._test_api_key  # type: ignore[attr-defined]

        await _seed_usage(org.id, api_key.id, count=3)

        resp = await api_key_client.get("/v1/usage/summary")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_calls"] == 3
        assert data["total_cost_kobo"] > 0
        assert data["total_cost_naira"] > 0
        assert isinstance(data["by_model"], list)

    async def test_summary_with_days(self, api_key_client: AsyncClient):
        resp = await api_key_client.get("/v1/usage/summary?days=7")
        assert resp.status_code == 200
        assert resp.json()["period_days"] == 7

    async def test_summary_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/v1/usage/summary")
        assert resp.status_code == 401
