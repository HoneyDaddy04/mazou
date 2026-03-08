"""Tests for /api/auth/* endpoints: signup, login, me, logout."""

import uuid

import pytest
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio(loop_scope="session")


def _unique_email() -> str:
    return f"test-{uuid.uuid4().hex[:8]}@mazou.com"


# ── Signup ────────────────────────────────────────────────────────────────


class TestSignup:
    async def test_signup_success(self, client: AsyncClient):
        email = _unique_email()
        resp = await client.post("/api/auth/signup", json={
            "email": email,
            "password": "securepass123",
            "full_name": "New User",
            "org_name": f"Org {uuid.uuid4().hex[:6]}",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "user" in data
        user = data["user"]
        assert user["email"] == email
        assert user["full_name"] == "New User"
        assert user["role"] == "owner"
        assert user["org_plan"] == "free"
        # JWT cookie should be set
        assert "mazou_session" in resp.cookies

    async def test_signup_duplicate_email(self, client: AsyncClient):
        email = _unique_email()
        payload = {
            "email": email,
            "password": "securepass123",
            "full_name": "User A",
            "org_name": f"Org {uuid.uuid4().hex[:6]}",
        }
        resp1 = await client.post("/api/auth/signup", json=payload)
        assert resp1.status_code == 200

        # Second signup with same email but different org name
        payload2 = {**payload, "org_name": f"Org {uuid.uuid4().hex[:6]}"}
        resp2 = await client.post("/api/auth/signup", json=payload2)
        assert resp2.status_code == 409
        assert "unable to create account" in resp2.json()["detail"].lower()

    async def test_signup_short_password(self, client: AsyncClient):
        resp = await client.post("/api/auth/signup", json={
            "email": _unique_email(),
            "password": "short",
            "full_name": "User",
            "org_name": f"Org {uuid.uuid4().hex[:6]}",
        })
        assert resp.status_code == 422

    async def test_signup_invalid_email(self, client: AsyncClient):
        resp = await client.post("/api/auth/signup", json={
            "email": "not-an-email",
            "password": "securepass123",
            "full_name": "User",
            "org_name": f"Org {uuid.uuid4().hex[:6]}",
        })
        assert resp.status_code == 422

    async def test_signup_missing_fields(self, client: AsyncClient):
        resp = await client.post("/api/auth/signup", json={
            "email": _unique_email(),
        })
        assert resp.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────


class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        email = _unique_email()
        password = "securepass123"
        # First signup
        await client.post("/api/auth/signup", json={
            "email": email,
            "password": password,
            "full_name": "Login User",
            "org_name": f"Org {uuid.uuid4().hex[:6]}",
        })

        resp = await client.post("/api/auth/login", json={
            "email": email,
            "password": password,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["user"]["email"] == email
        assert "mazou_session" in resp.cookies

    async def test_login_wrong_password(self, client: AsyncClient):
        email = _unique_email()
        await client.post("/api/auth/signup", json={
            "email": email,
            "password": "securepass123",
            "full_name": "User",
            "org_name": f"Org {uuid.uuid4().hex[:6]}",
        })

        resp = await client.post("/api/auth/login", json={
            "email": email,
            "password": "wrongpassword",
        })
        assert resp.status_code == 401
        assert "invalid" in resp.json()["detail"].lower()

    async def test_login_nonexistent_email(self, client: AsyncClient):
        resp = await client.post("/api/auth/login", json={
            "email": _unique_email(),
            "password": "whatever123",
        })
        assert resp.status_code == 401


# ── Me ────────────────────────────────────────────────────────────────────


class TestMe:
    async def test_me_authenticated(self, auth_client: AsyncClient):
        resp = await auth_client.get("/api/auth/me")
        assert resp.status_code == 200
        user = resp.json()["user"]
        assert "email" in user
        assert user["role"] == "owner"

    async def test_me_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/api/auth/me")
        assert resp.status_code == 401

    async def test_me_invalid_token(self, client: AsyncClient):
        resp = await client.get(
            "/api/auth/me",
            cookies={"mazou_session": "invalid.jwt.token"},
        )
        assert resp.status_code == 401


# ── Logout ────────────────────────────────────────────────────────────────


class TestLogout:
    async def test_logout(self, client: AsyncClient):
        resp = await client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert resp.json()["ok"] is True
        cookie_header = resp.headers.get("set-cookie", "")
        assert "mazou_session" in cookie_header
