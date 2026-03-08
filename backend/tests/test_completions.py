"""Tests for /v1/chat/completions — the core gateway endpoint.

All LLM calls are mocked via litellm.acompletion to avoid real provider calls.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient


pytestmark = pytest.mark.asyncio(loop_scope="session")


def _mock_litellm_response(content="Hello!", model="gpt-4o-mini", input_tokens=10, output_tokens=5):
    """Build a mock LiteLLM response object."""
    usage = MagicMock()
    usage.prompt_tokens = input_tokens
    usage.completion_tokens = output_tokens
    usage.total_tokens = input_tokens + output_tokens

    choice = MagicMock()
    choice.message = MagicMock()
    choice.message.content = content
    choice.finish_reason = "stop"
    choice.index = 0

    response = MagicMock()
    response.usage = usage
    response.choices = [choice]
    response.model = model
    response.id = "chatcmpl-test123"
    response.created = 1700000000
    response.object = "chat.completion"

    def model_dump():
        return {
            "id": "chatcmpl-test123",
            "object": "chat.completion",
            "created": 1700000000,
            "model": model,
            "choices": [{
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }],
            "usage": {
                "prompt_tokens": input_tokens,
                "completion_tokens": output_tokens,
                "total_tokens": input_tokens + output_tokens,
            },
        }

    response.model_dump = model_dump
    return response


class TestChatCompletions:
    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_basic_completion(self, mock_acompletion, api_key_client: AsyncClient):
        mock_acompletion.return_value = _mock_litellm_response()

        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hi"}],
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "choices" in data
        assert data["choices"][0]["message"]["content"] == "Hello!"
        assert "x_mazou" in data
        assert "request_id" in data["x_mazou"]
        assert data["x_mazou"]["model"] == "gpt-4o-mini"

    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_completion_with_tag(self, mock_acompletion, api_key_client: AsyncClient):
        mock_acompletion.return_value = _mock_litellm_response()

        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hello"}],
            "tag": "customer-support",
        })
        assert resp.status_code == 200

    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_completion_with_mazu_extensions(self, mock_acompletion, api_key_client: AsyncClient):
        mock_acompletion.return_value = _mock_litellm_response()

        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "auto",
            "messages": [{"role": "user", "content": "Help me with something"}],
            "mazu": {
                "budget": "low",
                "tag": "search",
            },
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["x_mazou"]["routed"] is True

    async def test_completion_unauthenticated(self, client: AsyncClient):
        resp = await client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hi"}],
        })
        assert resp.status_code == 401

    async def test_completion_invalid_api_key(self, client: AsyncClient):
        resp = await client.post(
            "/v1/chat/completions",
            json={
                "model": "gpt-4o-mini",
                "messages": [{"role": "user", "content": "Hi"}],
            },
            headers={"Authorization": "Bearer invalid_key"},
        )
        assert resp.status_code == 401

    async def test_completion_missing_messages(self, api_key_client: AsyncClient):
        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
        })
        assert resp.status_code == 422

    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_completion_with_test_key_skips_balance(self, mock_acompletion, test_key_client: AsyncClient):
        """Test keys skip wallet balance check (balance=0 should still work)."""
        mock_acompletion.return_value = _mock_litellm_response()

        resp = await test_key_client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Test"}],
        })
        assert resp.status_code == 200

    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_completion_provider_error(self, mock_acompletion, api_key_client: AsyncClient):
        mock_acompletion.side_effect = Exception("Provider timeout")

        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hi"}],
        })
        assert resp.status_code == 502
        assert "provider error" in resp.json()["detail"].lower()

    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_completion_with_max_tokens(self, mock_acompletion, api_key_client: AsyncClient):
        mock_acompletion.return_value = _mock_litellm_response()

        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "gpt-4o-mini",
            "messages": [{"role": "user", "content": "Hi"}],
            "max_tokens": 100,
            "temperature": 0.5,
        })
        assert resp.status_code == 200

    @patch("backend.gateway.routing.fallback.litellm.acompletion", new_callable=AsyncMock)
    async def test_completion_auto_routing(self, mock_acompletion, api_key_client: AsyncClient):
        """model=auto should trigger the routing engine."""
        mock_acompletion.return_value = _mock_litellm_response(model="gemini-2.5-flash")

        resp = await api_key_client.post("/v1/chat/completions", json={
            "model": "auto",
            "messages": [{"role": "user", "content": "Hi"}],
        })
        assert resp.status_code == 200
        # Auto should trigger routing
        data = resp.json()
        assert data["x_mazou"]["routed"] is True
