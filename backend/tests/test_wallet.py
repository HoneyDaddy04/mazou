"""Tests for /v1/wallet endpoints: balance, topup."""

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio(loop_scope="session")


class TestGetWallet:
    async def test_get_wallet_balance(self, auth_client: AsyncClient):
        resp = await auth_client.get("/v1/wallet")
        assert resp.status_code == 200
        data = resp.json()
        assert data["currency"] == "NGN"
        assert data["balance_kobo"] == 1_000_000
        assert data["balance_naira"] == 10_000.0
        assert "id" in data

    async def test_get_wallet_unauthenticated(self, client: AsyncClient):
        resp = await client.get("/v1/wallet")
        assert resp.status_code == 401


class TestTopup:
    @patch("backend.billing.paystack.initialize_transaction", new_callable=AsyncMock)
    async def test_topup_success(self, mock_paystack, auth_client: AsyncClient):
        mock_paystack.return_value = {
            "authorization_url": "https://paystack.com/pay/test123",
            "reference": "ref_abc123",
        }

        resp = await auth_client.post("/v1/wallet/topup", json={
            "amount_naira": 5000.0,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["authorization_url"] == "https://paystack.com/pay/test123"
        assert data["reference"] == "ref_abc123"
        assert data["amount_naira"] == 5000.0

    @patch("backend.billing.paystack.initialize_transaction", new_callable=AsyncMock)
    async def test_topup_with_callback(self, mock_paystack, auth_client: AsyncClient):
        mock_paystack.return_value = {
            "authorization_url": "https://paystack.com/pay/test456",
            "reference": "ref_xyz789",
        }

        resp = await auth_client.post("/v1/wallet/topup", json={
            "amount_naira": 1000.0,
            "callback_url": "https://myapp.com/callback",
        })
        assert resp.status_code == 200
        mock_paystack.assert_called_once()
        call_kwargs = mock_paystack.call_args
        assert call_kwargs.kwargs["callback_url"] == "https://myapp.com/callback"

    async def test_topup_zero_amount(self, auth_client: AsyncClient):
        resp = await auth_client.post("/v1/wallet/topup", json={
            "amount_naira": 0,
        })
        assert resp.status_code == 422

    async def test_topup_negative_amount(self, auth_client: AsyncClient):
        resp = await auth_client.post("/v1/wallet/topup", json={
            "amount_naira": -100,
        })
        assert resp.status_code == 422

    async def test_topup_unauthenticated(self, client: AsyncClient):
        resp = await client.post("/v1/wallet/topup", json={
            "amount_naira": 1000,
        })
        assert resp.status_code == 401

    @patch("backend.billing.paystack.initialize_transaction", new_callable=AsyncMock)
    async def test_topup_paystack_failure(self, mock_paystack, auth_client: AsyncClient):
        mock_paystack.side_effect = Exception("Paystack unavailable")

        resp = await auth_client.post("/v1/wallet/topup", json={
            "amount_naira": 1000.0,
        })
        assert resp.status_code == 500
        assert "failed" in resp.json()["detail"].lower()
