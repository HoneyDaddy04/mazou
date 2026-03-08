"""Core gateway: /v1/chat/completions — the heart of Mazou."""

from __future__ import annotations

import asyncio
import json
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from backend.billing.wallet import InsufficientBalanceError, debit_wallet
from backend.gateway.middleware.auth import ApiKeyData, check_rate_limit, validate_api_key
from backend.gateway.routing.engine import apply_routing
from backend.gateway.routing.fallback import completion_with_fallback, streaming_completion_with_fallback
from backend.shared.config import settings
from backend.shared.database import get_supabase
from backend.shared.encryption import decrypt_key
from backend.shared.pricing import (
    calculate_cost_kobo,
    calculate_savings_kobo,
    estimate_cost_kobo,
    get_provider_api_key,
    get_provider_for_model,
)
from backend.shared.schemas import ChatCompletionRequest

router = APIRouter()


def _request_id() -> str:
    return f"mazou-{uuid.uuid4().hex[:16]}"


def _extract_extensions(body: ChatCompletionRequest) -> dict:
    """Merge mazu extensions with flat shorthand fields."""
    ext = {}
    if body.mazu:
        ext = body.mazu.model_dump(exclude_none=True)
    if body.tag and "tag" not in ext:
        ext["tag"] = body.tag
    if body.budget and "budget" not in ext:
        ext["budget"] = body.budget
    if body.agent_tag and "agent_tag" not in ext:
        ext["agent_tag"] = body.agent_tag
    return ext


def _get_byok_key(db, org_id: str, provider: str) -> str | None:
    """Look up a connected BYOK key for the org+provider. Returns decrypted key or None."""
    result = (
        db.table("byok_keys")
        .select("key_encrypted")
        .eq("org_id", org_id)
        .eq("provider", provider)
        .eq("status", "connected")
        .limit(1)
        .execute()
    )
    if result.data:
        try:
            return decrypt_key(result.data[0]["key_encrypted"])
        except Exception:
            return None
    return None


def _log_usage_sync(
    org_id: str,
    api_key_id: str,
    request_id: str,
    model: str,
    provider: str,
    input_tokens: int,
    output_tokens: int,
    cost_kobo: int,
    latency_ms: int,
    feature_tag: str | None,
    agent_tag: str | None = None,
    routed_from: str | None = None,
    routed_to: str | None = None,
    routing_reason: str | None = None,
    savings_kobo: int = 0,
    is_test: bool = False,
    is_byok: bool = False,
    bundle_id: str | None = None,
    status: str = "success",
):
    """Synchronous usage logging with its own Supabase client call."""
    db = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    log_data = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "api_key_id": api_key_id,
        "request_id": request_id,
        "model": model,
        "provider": provider,
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "cost_kobo": cost_kobo,
        "latency_ms": latency_ms,
        "feature_tag": feature_tag,
        "agent_tag": agent_tag,
        "routed_from": routed_from,
        "routed_to": routed_to,
        "routing_reason": routing_reason,
        "savings_kobo": savings_kobo,
        "is_test": is_test,
        "bundle_id": bundle_id,
        "status": status,
        "created_at": now,
    }
    db.table("usage_logs").insert(log_data).execute()

    # Debit: bundle tokens first, then wallet (skip for test keys and BYOK)
    if not is_test and not is_byok:
        total_tokens = input_tokens + output_tokens
        bundle_debited = False
        if bundle_id and total_tokens > 0:
            try:
                from backend.billing.bundles import debit_bundle
                debit_bundle(db, bundle_id, total_tokens)
                bundle_debited = True
            except Exception:
                pass  # Bundle exhausted; fall through to wallet

        if not bundle_debited and cost_kobo > 0:
            try:
                debit_wallet(
                    db,
                    org_id,
                    cost_kobo,
                    f"API call: {model} ({input_tokens}+{output_tokens} tokens)",
                    idempotency_key=f"usage:{request_id}",
                )
            except (InsufficientBalanceError, Exception):
                pass  # Log anyway; balance was pre-checked


async def _log_usage_background(**kwargs):
    """Fire-and-forget: run sync logging in a thread."""
    try:
        await asyncio.to_thread(_log_usage_sync, **kwargs)
    except Exception:
        pass  # Best effort


@router.post("/chat/completions")
async def chat_completions(
    body: ChatCompletionRequest,
    request: Request,
    key_data: ApiKeyData = Depends(validate_api_key),
):
    # Rate limit check
    await check_rate_limit(request, key_data)

    request_id = _request_id()
    ext = _extract_extensions(body)
    org_id = key_data.org.id

    # Routing (synchronous now, run in thread)
    db = get_supabase()
    routing = await asyncio.to_thread(
        apply_routing,
        org_id=org_id,
        requested_model=body.model,
        messages=[m.model_dump() for m in body.messages],
        budget=ext.get("budget"),
        db=db,
    )

    # BYOK lookup
    provider = get_provider_for_model(routing.model)
    byok_api_key: str | None = None
    is_byok = False
    byok_api_key = await asyncio.to_thread(_get_byok_key, db, org_id, provider)
    if byok_api_key:
        is_byok = True

    # Pre-flight: check bundle or wallet balance — skip for BYOK
    input_token_estimate = sum(len(str(m.content).split()) * 2 for m in body.messages)
    max_output = body.max_tokens or 4096
    estimated_kobo = estimate_cost_kobo(routing.model, input_token_estimate, max_output)

    active_bundle = None
    if not key_data.is_test and not is_byok:
        from backend.billing.bundles import get_active_bundle
        from backend.billing.wallet import check_sufficient_balance

        active_bundle = await asyncio.to_thread(get_active_bundle, db, org_id)

        if not active_bundle:
            # No bundle — wallet must cover the cost
            has_balance = await asyncio.to_thread(check_sufficient_balance, db, org_id, estimated_kobo)
            if not has_balance:
                raise HTTPException(
                    status_code=402,
                    detail="Insufficient wallet balance. Please top up your Naira wallet or purchase a token bundle.",
                    headers={"X-Mazou-Request-Id": request_id},
                )
        else:
            # Bundle exists but may not cover this request — ensure wallet can back it up
            remaining = active_bundle.get("remaining_tokens", 0)
            estimated_tokens = input_token_estimate + (body.max_tokens or 4096)
            if remaining < estimated_tokens:
                has_balance = await asyncio.to_thread(check_sufficient_balance, db, org_id, estimated_kobo)
                if not has_balance:
                    raise HTTPException(
                        status_code=402,
                        detail="Bundle has insufficient tokens and wallet balance is too low. Please top up your wallet.",
                        headers={"X-Mazou-Request-Id": request_id},
                    )

    # Build LiteLLM kwargs
    llm_kwargs = {
        "messages": [m.model_dump() for m in body.messages],
    }
    if body.max_tokens:
        llm_kwargs["max_tokens"] = body.max_tokens
    if body.temperature is not None:
        llm_kwargs["temperature"] = body.temperature
    if body.top_p is not None:
        llm_kwargs["top_p"] = body.top_p
    if body.n:
        llm_kwargs["n"] = body.n
    if body.stop:
        llm_kwargs["stop"] = body.stop

    # Streaming
    if body.stream:
        return await _handle_streaming(
            routing=routing,
            llm_kwargs=llm_kwargs,
            request_id=request_id,
            org_id=org_id,
            api_key_id=key_data.key.id,
            is_test=key_data.is_test,
            is_byok=is_byok,
            byok_api_key=byok_api_key,
            ext=ext,
            requested_model=body.model,
            bundle_id=active_bundle["id"] if active_bundle else None,
        )

    # Non-streaming
    start_ms = time.time()
    try:
        response, actual_model, actual_provider = await completion_with_fallback(
            model=routing.model,
            api_key=byok_api_key,
            **llm_kwargs,
        )
    except Exception as e:
        # Log failed request
        latency_ms = int((time.time() - start_ms) * 1000)
        asyncio.create_task(_log_usage_background(
            org_id=org_id,
            api_key_id=key_data.key.id,
            request_id=request_id,
            model=routing.model,
            provider=routing.provider,
            input_tokens=0,
            output_tokens=0,
            cost_kobo=0,
            latency_ms=latency_ms,
            feature_tag=ext.get("tag"),
            agent_tag=ext.get("agent_tag"),
            routed_from=routing.routed_from,
            routed_to=routing.model if routing.was_routed else None,
            routing_reason=routing.reason,
            savings_kobo=0,
            is_test=key_data.is_test,
            is_byok=is_byok,
            status="error",
        ))
        raise HTTPException(status_code=502, detail=f"Provider error: {str(e)}")

    latency_ms = int((time.time() - start_ms) * 1000)

    # Extract token usage
    usage = response.get("usage", {}) if isinstance(response, dict) else getattr(response, "usage", None)
    input_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
    output_tokens = getattr(usage, "completion_tokens", 0) if usage else 0

    # Calculate cost
    cost_kobo = calculate_cost_kobo(actual_model, input_tokens, output_tokens)
    savings_kobo = calculate_savings_kobo(
        body.model if body.model != "auto" else "gpt-5",
        actual_model,
        input_tokens,
        output_tokens,
    ) if routing.was_routed else 0

    # Fire-and-forget: log usage + debit bundle or wallet
    asyncio.create_task(_log_usage_background(
        org_id=org_id,
        api_key_id=key_data.key.id,
        request_id=request_id,
        model=actual_model,
        provider=actual_provider,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        cost_kobo=cost_kobo,
        latency_ms=latency_ms,
        feature_tag=ext.get("tag"),
        agent_tag=ext.get("agent_tag"),
        routed_from=routing.routed_from,
        routed_to=actual_model if routing.was_routed else None,
        routing_reason=routing.reason,
        savings_kobo=savings_kobo,
        is_test=key_data.is_test,
        is_byok=is_byok,
        bundle_id=active_bundle["id"] if active_bundle else None,
    ))

    # Build OpenAI-compatible response
    resp_data = response if isinstance(response, dict) else response.model_dump()

    # Add Mazou headers via response metadata
    resp_data["x_mazou"] = {
        "request_id": request_id,
        "model": actual_model,
        "provider": actual_provider,
        "cost_kobo": cost_kobo,
        "cost_naira": round(cost_kobo / 100, 4),
        "latency_ms": latency_ms,
        "routed": routing.was_routed,
        "routing_reason": routing.reason,
        "savings_kobo": savings_kobo,
    }

    return resp_data


async def _handle_streaming(
    routing,
    llm_kwargs: dict,
    request_id: str,
    org_id: str,
    api_key_id: str,
    is_test: bool,
    is_byok: bool = False,
    byok_api_key: str | None = None,
    ext: dict = None,
    requested_model: str = "",
    bundle_id: str | None = None,
):
    """Handle streaming SSE response with provider fallback."""
    ext = ext or {}

    async def stream_generator():
        nonlocal_state = {"input_tokens": 0, "actual_model": routing.model, "actual_provider": routing.provider}
        start_ms = time.time()
        total_output_tokens = 0

        try:
            response, actual_model, actual_provider = await streaming_completion_with_fallback(
                model=routing.model,
                messages=llm_kwargs["messages"],
                api_key=byok_api_key,
                **{k: v for k, v in llm_kwargs.items() if k != "messages"},
            )
            nonlocal_state["actual_model"] = actual_model
            nonlocal_state["actual_provider"] = actual_provider

            async for chunk in response:
                chunk_data = chunk if isinstance(chunk, dict) else chunk.model_dump()

                # Track tokens from stream
                usage = chunk_data.get("usage")
                if usage:
                    input_tokens_val = usage.get("prompt_tokens", 0)
                    if input_tokens_val:
                        nonlocal_state["input_tokens"] = input_tokens_val

                # Count output tokens from choices
                choices = chunk_data.get("choices", [])
                for choice in choices:
                    delta = choice.get("delta", {})
                    if delta.get("content"):
                        # Rough token estimate: 1 token per 4 chars
                        total_output_tokens += max(1, len(delta["content"]) // 4)

                yield f"data: {json.dumps(chunk_data)}\n\n"

            yield "data: [DONE]\n\n"

        except Exception as e:
            error_data = {"error": {"message": str(e), "type": "provider_error"}}
            yield f"data: {json.dumps(error_data)}\n\n"
            yield "data: [DONE]\n\n"
        finally:
            # Post-stream accounting
            latency_ms = int((time.time() - start_ms) * 1000)
            input_tokens = nonlocal_state["input_tokens"]
            if not input_tokens:
                input_tokens = sum(len(str(m.get("content", "")).split()) * 2 for m in llm_kwargs["messages"])

            actual_model = nonlocal_state["actual_model"]
            actual_provider = nonlocal_state["actual_provider"]
            was_rerouted = actual_model != routing.model or routing.was_routed

            cost_kobo = calculate_cost_kobo(actual_model, input_tokens, total_output_tokens)
            savings = calculate_savings_kobo(
                requested_model if requested_model != "auto" else "gpt-5",
                actual_model,
                input_tokens,
                total_output_tokens,
            ) if was_rerouted else 0

            reason = routing.reason
            if actual_model != routing.model:
                reason = f"Fallback from {routing.model} to {actual_model}"

            asyncio.create_task(_log_usage_background(
                org_id=org_id,
                api_key_id=api_key_id,
                request_id=request_id,
                model=actual_model,
                provider=actual_provider,
                input_tokens=input_tokens,
                output_tokens=total_output_tokens,
                cost_kobo=cost_kobo,
                latency_ms=latency_ms,
                feature_tag=ext.get("tag"),
                agent_tag=ext.get("agent_tag"),
                routed_from=routing.routed_from or routing.model,
                routed_to=actual_model if was_rerouted else None,
                routing_reason=reason,
                savings_kobo=savings,
                is_test=is_test,
                is_byok=is_byok,
                bundle_id=bundle_id,
            ))

    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "X-Mazou-Request-Id": request_id,
            "X-Mazou-Model": routing.model,
            "X-Mazou-Provider": routing.provider,
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
