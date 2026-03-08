"""Tests for /v1/models — model catalogue (no auth required)."""

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio(loop_scope="session")


class TestListModels:
    async def test_list_all_models(self, client: AsyncClient):
        resp = await client.get("/v1/models")
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert "count" in data
        assert data["count"] > 0
        assert len(data["data"]) == data["count"]

    async def test_model_structure(self, client: AsyncClient):
        resp = await client.get("/v1/models")
        model = resp.json()["data"][0]
        assert "id" in model
        assert "name" in model
        assert "provider" in model
        assert "category" in model
        assert "input_cost_usd_per_1m" in model
        assert "output_cost_usd_per_1m" in model
        assert "is_african" in model

    async def test_filter_african_models(self, client: AsyncClient):
        resp = await client.get("/v1/models?is_african=true")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] > 0
        for model in data["data"]:
            assert model["is_african"] is True
            assert model["category"] == "african"

    async def test_filter_non_african_models(self, client: AsyncClient):
        resp = await client.get("/v1/models?is_african=false")
        assert resp.status_code == 200
        for model in resp.json()["data"]:
            assert model["is_african"] is False

    async def test_filter_by_category(self, client: AsyncClient):
        resp = await client.get("/v1/models?category=frontier")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] > 0
        for model in data["data"]:
            assert model["category"] == "frontier"

    async def test_filter_by_provider(self, client: AsyncClient):
        resp = await client.get("/v1/models?provider=openai")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] > 0
        for model in data["data"]:
            assert model["provider"].lower() == "openai"

    async def test_filter_by_tag(self, client: AsyncClient):
        resp = await client.get("/v1/models?tag=coding")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] > 0
        for model in data["data"]:
            assert "coding" in model["tags"]

    async def test_filter_no_results(self, client: AsyncClient):
        resp = await client.get("/v1/models?category=nonexistent")
        assert resp.status_code == 200
        data = resp.json()
        assert data["count"] == 0
        assert data["data"] == []

    async def test_combined_filters(self, client: AsyncClient):
        resp = await client.get("/v1/models?provider=openai&category=budget")
        assert resp.status_code == 200
        for model in resp.json()["data"]:
            assert model["provider"].lower() == "openai"
            assert model["category"] == "budget"


class TestGetModel:
    async def test_get_specific_model(self, client: AsyncClient):
        resp = await client.get("/v1/models/gpt-4o-mini")
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == "gpt-4o-mini"
        assert data["provider"] == "OpenAI"
        assert data["is_african"] is False

    async def test_get_african_model(self, client: AsyncClient):
        resp = await client.get("/v1/models/yarngpt")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_african"] is True
        assert data["african_meta"] is not None
        assert "languages" in data["african_meta"]

    async def test_get_nonexistent_model(self, client: AsyncClient):
        resp = await client.get("/v1/models/nonexistent-model")
        assert resp.status_code == 404
