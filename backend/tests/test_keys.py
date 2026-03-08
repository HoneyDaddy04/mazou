"""Tests for /v1/keys endpoints: create, list, revoke."""

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio(loop_scope="session")


class TestCreateKey:
    async def test_create_live_key(self, auth_client: AsyncClient):
        resp = await auth_client.post("/v1/keys", json={
            "name": "My Live Key",
            "environment": "live",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "My Live Key"
        assert data["environment"] == "live"
        assert data["status"] == "active"
        assert data["key"].startswith("mz_live_")
        assert len(data["key"]) > 20

    async def test_create_test_key(self, auth_client: AsyncClient):
        resp = await auth_client.post("/v1/keys", json={
            "name": "My Test Key",
            "environment": "test",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["key"].startswith("mz_test_")
        assert data["environment"] == "test"

    async def test_create_key_invalid_environment(self, auth_client: AsyncClient):
        resp = await auth_client.post("/v1/keys", json={
            "name": "Bad Key",
            "environment": "staging",
        })
        assert resp.status_code == 422

    async def test_create_key_unauthenticated(self, client: AsyncClient):
        resp = await client.post("/v1/keys", json={
            "name": "No Auth Key",
            "environment": "live",
        })
        assert resp.status_code == 401

    async def test_create_key_empty_name(self, auth_client: AsyncClient):
        resp = await auth_client.post("/v1/keys", json={
            "name": "",
            "environment": "live",
        })
        assert resp.status_code == 422


class TestListKeys:
    async def test_list_keys_empty(self, auth_client: AsyncClient):
        resp = await auth_client.get("/v1/keys")
        assert resp.status_code == 200
        assert resp.json() == []

    async def test_list_keys_after_create(self, auth_client: AsyncClient):
        await auth_client.post("/v1/keys", json={"name": "Key 1", "environment": "live"})
        await auth_client.post("/v1/keys", json={"name": "Key 2", "environment": "test"})

        resp = await auth_client.get("/v1/keys")
        assert resp.status_code == 200
        keys = resp.json()
        assert len(keys) == 2
        # Full key should NOT be in list response
        for k in keys:
            assert "key" not in k or not k.get("key", "").startswith("mz_")

    async def test_list_keys_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/v1/keys")
        assert resp.status_code == 401


class TestRevokeKey:
    async def test_revoke_key(self, auth_client: AsyncClient):
        create_resp = await auth_client.post("/v1/keys", json={"name": "Revocable", "environment": "live"})
        key_id = create_resp.json()["id"]

        resp = await auth_client.delete(f"/v1/keys/{key_id}")
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

        # Verify key is revoked in list
        list_resp = await auth_client.get("/v1/keys")
        keys = list_resp.json()
        revoked = [k for k in keys if k["id"] == key_id]
        assert len(revoked) == 1
        assert revoked[0]["status"] == "revoked"

    async def test_revoke_nonexistent_key(self, auth_client: AsyncClient):
        resp = await auth_client.delete("/v1/keys/nonexistent-id")
        assert resp.status_code == 404

    async def test_revoke_key_unauthenticated(self, client: AsyncClient):
        resp = await client.delete("/v1/keys/some-id")
        assert resp.status_code == 401
