"""Tests for /webhooks/paystack — payment webhook handler."""

import hashlib
import hmac
import json
import uuid

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient

from backend.shared.config import settings
from backend.tests.conftest import _create_org_user_wallet, _test_session_factory


pytestmark = pytest.mark.asyncio(loop_scope="session")


def _sign_payload(payload: bytes) -> str:
    """Compute HMAC-SHA512 signature for Paystack webhook."""
    return hmac.new(
        settings.paystack_secret_key.encode(),
        payload,
        hashlib.sha512,
    ).hexdigest()


def _make_charge_event(org_id: str, amount_kobo: int = 500_000, reference: str | None = None):
    if reference is None:
        reference = f"ref_{uuid.uuid4().hex[:8]}"
    return {
        "event": "charge.success",
        "data": {
            "reference": reference,
            "amount": amount_kobo,
            "metadata": {"org_id": org_id},
        },
    }


class TestPaystackWebhook:
    @patch("backend.gateway.routers.webhooks.verify_transaction", new_callable=AsyncMock)
    async def test_successful_payment(self, mock_verify, client: AsyncClient):
        async with _test_session_factory() as db:
            org, profile, wallet = await _create_org_user_wallet(db, balance_kobo=100_000)

        event = _make_charge_event(org.id, amount_kobo=500_000)
        payload = json.dumps(event).encode()
        signature = _sign_payload(payload)

        mock_verify.return_value = {"status": "success", "amount": 500_000}

        resp = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["amount_kobo"] == 500_000

    async def test_invalid_signature(self, client: AsyncClient):
        async with _test_session_factory() as db:
            org, profile, wallet = await _create_org_user_wallet(db)

        event = _make_charge_event(org.id)
        payload = json.dumps(event).encode()

        resp = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": "invalid_signature",
            },
        )
        assert resp.status_code == 400
        assert "signature" in resp.json()["detail"].lower()

    @patch("backend.gateway.routers.webhooks.verify_transaction", new_callable=AsyncMock)
    async def test_non_charge_event_ignored(self, mock_verify, client: AsyncClient):
        event = {"event": "transfer.success", "data": {"reference": "ref_123"}}
        payload = json.dumps(event).encode()
        signature = _sign_payload(payload)

        resp = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp.status_code == 200
        assert "ignored" in resp.json()["message"].lower()

    @patch("backend.gateway.routers.webhooks.verify_transaction", new_callable=AsyncMock)
    async def test_amount_mismatch(self, mock_verify, client: AsyncClient):
        async with _test_session_factory() as db:
            org, profile, wallet = await _create_org_user_wallet(db)

        event = _make_charge_event(org.id, amount_kobo=500_000)
        payload = json.dumps(event).encode()
        signature = _sign_payload(payload)

        mock_verify.return_value = {"status": "success", "amount": 100_000}

        resp = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp.status_code == 400
        assert "mismatch" in resp.json()["detail"].lower()

    @patch("backend.gateway.routers.webhooks.verify_transaction", new_callable=AsyncMock)
    async def test_failed_verification(self, mock_verify, client: AsyncClient):
        async with _test_session_factory() as db:
            org, profile, wallet = await _create_org_user_wallet(db)

        event = _make_charge_event(org.id)
        payload = json.dumps(event).encode()
        signature = _sign_payload(payload)

        mock_verify.return_value = {"status": "failed", "amount": 500_000}

        resp = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp.status_code == 400

    @patch("backend.gateway.routers.webhooks.verify_transaction", new_callable=AsyncMock)
    async def test_idempotent_duplicate(self, mock_verify, client: AsyncClient):
        """Same reference processed twice should be idempotent."""
        async with _test_session_factory() as db:
            org, profile, wallet = await _create_org_user_wallet(db, balance_kobo=100_000)

        reference = f"dup_ref_{uuid.uuid4().hex[:8]}"
        event = _make_charge_event(org.id, amount_kobo=200_000, reference=reference)
        payload = json.dumps(event).encode()
        signature = _sign_payload(payload)

        mock_verify.return_value = {"status": "success", "amount": 200_000}

        # First call
        resp1 = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp1.status_code == 200

        # Second call with same reference (idempotent)
        resp2 = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp2.status_code == 200
        assert "already processed" in resp2.json()["message"].lower()

    @patch("backend.gateway.routers.webhooks.verify_transaction", new_callable=AsyncMock)
    async def test_missing_reference(self, mock_verify, client: AsyncClient):
        async with _test_session_factory() as db:
            org, profile, wallet = await _create_org_user_wallet(db)

        event = {
            "event": "charge.success",
            "data": {
                "amount": 100_000,
                "metadata": {"org_id": org.id},
            },
        }
        payload = json.dumps(event).encode()
        signature = _sign_payload(payload)

        resp = await client.post(
            "/webhooks/paystack",
            content=payload,
            headers={
                "Content-Type": "application/json",
                "x-paystack-signature": signature,
            },
        )
        assert resp.status_code == 400
