"""Fallback logic: retry with alternative models on provider failure."""

from __future__ import annotations

import litellm

from backend.shared.pricing import LITELLM_MODEL_MAP, get_provider_api_key, get_provider_for_model

# Fallback chains: if primary fails, try these in order
FALLBACK_CHAINS: dict[str, list[str]] = {
    "gpt-5": ["claude-sonnet-4.6", "gemini-2.5-pro"],
    "gpt-5.2": ["claude-sonnet-4.6", "gemini-2.5-pro"],
    "claude-opus-4.6": ["gpt-5", "gemini-2.5-pro"],
    "claude-sonnet-4.6": ["gpt-5", "gemini-2.5-flash"],
    "claude-haiku-4.5": ["gpt-4o-mini", "gemini-2.5-flash"],
    "gemini-2.5-pro": ["gpt-5", "claude-sonnet-4.6"],
    "gemini-2.5-flash": ["gpt-4o-mini", "claude-haiku-4.5"],
}

# Default fallback if model not in chains
DEFAULT_FALLBACK = ["gpt-4o-mini", "gemini-2.5-flash"]


async def completion_with_fallback(
    model: str,
    messages: list[dict],
    api_key: str | None = None,
    max_retries: int = 2,
    **kwargs,
) -> tuple:
    """
    Call LiteLLM with automatic fallback on failure.
    Returns (response, actual_model_used, provider_used).
    """
    litellm_name = LITELLM_MODEL_MAP.get(model, f"openai/{model}")
    provider = get_provider_for_model(model)
    key = api_key or get_provider_api_key(provider)

    # Try primary model
    try:
        response = await litellm.acompletion(
            model=litellm_name,
            messages=messages,
            api_key=key if key else None,
            **kwargs,
        )
        return response, model, provider
    except Exception as primary_error:
        # Try fallbacks
        fallbacks = FALLBACK_CHAINS.get(model, DEFAULT_FALLBACK)

        for fallback_model in fallbacks[:max_retries]:
            try:
                fb_litellm = LITELLM_MODEL_MAP.get(fallback_model, f"openai/{fallback_model}")
                fb_provider = get_provider_for_model(fallback_model)
                fb_key = get_provider_api_key(fb_provider)

                if not fb_key:
                    continue

                response = await litellm.acompletion(
                    model=fb_litellm,
                    messages=messages,
                    api_key=fb_key,
                    **kwargs,
                )
                return response, fallback_model, fb_provider
            except Exception:
                continue

        # All fallbacks failed
        raise primary_error


async def streaming_completion_with_fallback(
    model: str,
    messages: list[dict],
    api_key: str | None = None,
    max_retries: int = 2,
    **kwargs,
) -> tuple:
    """
    Call LiteLLM streaming with automatic fallback on connection failure.
    Returns (async_stream, actual_model_used, provider_used).

    Fallback only triggers if the initial connection fails (provider down,
    auth error, etc.). Once streaming starts successfully, mid-stream
    failures cannot be retried since the client already received chunks.
    """
    litellm_name = LITELLM_MODEL_MAP.get(model, f"openai/{model}")
    provider = get_provider_for_model(model)
    key = api_key or get_provider_api_key(provider)

    # Try primary model
    try:
        response = await litellm.acompletion(
            model=litellm_name,
            messages=messages,
            api_key=key if key else None,
            stream=True,
            **kwargs,
        )
        return response, model, provider
    except Exception as primary_error:
        # Try fallbacks (skip if using BYOK — don't fall back to our keys)
        if api_key:
            raise primary_error

        fallbacks = FALLBACK_CHAINS.get(model, DEFAULT_FALLBACK)

        for fallback_model in fallbacks[:max_retries]:
            try:
                fb_litellm = LITELLM_MODEL_MAP.get(fallback_model, f"openai/{fallback_model}")
                fb_provider = get_provider_for_model(fallback_model)
                fb_key = get_provider_api_key(fb_provider)

                if not fb_key:
                    continue

                response = await litellm.acompletion(
                    model=fb_litellm,
                    messages=messages,
                    api_key=fb_key,
                    stream=True,
                    **kwargs,
                )
                return response, fallback_model, fb_provider
            except Exception:
                continue

        # All fallbacks failed
        raise primary_error
