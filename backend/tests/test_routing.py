"""Tests for /api/routing/rules CRUD endpoints."""

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio(loop_scope="session")


SAMPLE_RULE = {
    "name": "Budget Routing",
    "description": "Route low-budget requests to cheaper models",
    "condition": {"budget": "low"},
    "action": {"target_model": "gemini-2.5-flash"},
    "priority": 10,
    "status": "active",
}


class TestListRules:
    async def test_list_rules_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/routing/rules")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_rules_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/routing/rules")
        assert resp.status_code == 401


class TestCreateRule:
    async def test_create_rule(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/routing/rules", json=SAMPLE_RULE)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Budget Routing"
        assert data["priority"] == 10
        assert data["status"] == "active"
        assert data["condition"] == {"budget": "low"}
        assert data["action"] == {"target_model": "gemini-2.5-flash"}
        assert "id" in data
        assert data["triggers_count"] == 0

    async def test_create_rule_missing_name(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/routing/rules", json={
            "condition": {"budget": "low"},
            "action": {"target_model": "gpt-4o-mini"},
        })
        assert resp.status_code == 400

    async def test_create_rule_missing_condition(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/routing/rules", json={
            "name": "Bad Rule",
            "action": {"target_model": "gpt-4o-mini"},
        })
        assert resp.status_code == 400

    async def test_create_rule_missing_action(self, auth_client: AsyncClient):
        resp = await auth_client.post("/api/routing/rules", json={
            "name": "Bad Rule",
            "condition": {"budget": "low"},
        })
        assert resp.status_code == 400

    async def test_create_rule_unauthenticated(self, client: AsyncClient):
        resp = await client.post("/api/routing/rules", json=SAMPLE_RULE)
        assert resp.status_code == 401


class TestUpdateRule:
    async def test_update_rule(self, auth_client: AsyncClient):
        create_resp = await auth_client.post("/api/routing/rules", json=SAMPLE_RULE)
        rule_id = create_resp.json()["id"]

        resp = await auth_client.put(f"/api/routing/rules/{rule_id}", json={
            "name": "Updated Rule",
            "priority": 20,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Updated Rule"
        assert data["priority"] == 20
        # Unchanged fields should remain
        assert data["status"] == "active"
        assert data["condition"] == {"budget": "low"}

    async def test_update_rule_status(self, auth_client: AsyncClient):
        create_resp = await auth_client.post("/api/routing/rules", json=SAMPLE_RULE)
        rule_id = create_resp.json()["id"]

        resp = await auth_client.put(f"/api/routing/rules/{rule_id}", json={
            "status": "paused",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "paused"

    async def test_update_nonexistent_rule(self, auth_client: AsyncClient):
        resp = await auth_client.put("/api/routing/rules/nonexistent", json={
            "name": "Ghost",
        })
        assert resp.status_code == 404

    async def test_update_rule_unauthenticated(self, client: AsyncClient):
        resp = await client.put("/api/routing/rules/some-id", json={"name": "Nope"})
        assert resp.status_code == 401


class TestDeleteRule:
    async def test_delete_rule(self, auth_client: AsyncClient):
        create_resp = await auth_client.post("/api/routing/rules", json=SAMPLE_RULE)
        rule_id = create_resp.json()["id"]

        resp = await auth_client.delete(f"/api/routing/rules/{rule_id}")
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

        # Verify it's gone
        list_resp = await auth_client.get("/api/routing/rules")
        assert len(list_resp.json()) == 0

    async def test_delete_nonexistent_rule(self, auth_client: AsyncClient):
        resp = await auth_client.delete("/api/routing/rules/nonexistent")
        assert resp.status_code == 404

    async def test_delete_rule_unauthenticated(self, client: AsyncClient):
        resp = await client.delete("/api/routing/rules/some-id")
        assert resp.status_code == 401
