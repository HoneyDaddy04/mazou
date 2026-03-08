"""
Model pricing, LiteLLM mapping, and cost calculation.
Ported from app/src/lib/constants.ts — prices in USD per 1M tokens.
"""

from __future__ import annotations

from dataclasses import dataclass

from backend.shared.config import settings


@dataclass(frozen=True)
class ModelPricing:
    input_per_1m: float  # USD per 1M input tokens
    output_per_1m: float  # USD per 1M output tokens


# ── Pricing table ────────────────────────────────────────────────────────
# Source: OpenRouter, official docs, Feb 2026

MODEL_PRICING: dict[str, ModelPricing] = {
    # OpenAI
    "gpt-5.3-codex": ModelPricing(2.00, 8.00),
    "gpt-5.2": ModelPricing(2.00, 8.00),
    "gpt-5": ModelPricing(1.50, 6.00),
    "o3-pro": ModelPricing(20.00, 80.00),
    "o3-mini": ModelPricing(1.10, 4.40),
    "gpt-4.1": ModelPricing(2.00, 8.00),
    "gpt-4.1-mini": ModelPricing(0.40, 1.60),
    "gpt-4o": ModelPricing(2.50, 10.00),
    "gpt-4o-mini": ModelPricing(0.15, 0.60),
    # Anthropic
    "claude-opus-4.6": ModelPricing(15.00, 75.00),
    "claude-sonnet-4.6": ModelPricing(3.00, 15.00),
    "claude-haiku-4.5": ModelPricing(0.80, 4.00),
    # Google
    "gemini-2.5-pro": ModelPricing(1.25, 10.00),
    "gemini-2.5-flash": ModelPricing(0.15, 0.60),
    "gemini-2.5-flash-lite": ModelPricing(0.075, 0.30),
    # Meta
    "llama-4-scout": ModelPricing(0.18, 0.35),
    "llama-4-maverick": ModelPricing(0.25, 0.65),
    # DeepSeek
    "deepseek-v3.2": ModelPricing(0.27, 1.10),
    "deepseek-v3.1": ModelPricing(0.27, 1.10),
    "deepseek-r2": ModelPricing(0.55, 2.19),
    "deepseek-r1": ModelPricing(0.55, 2.19),
    # Mistral
    "mistral-large-2": ModelPricing(2.00, 6.00),
    "mistral-medium-3.1": ModelPricing(1.00, 3.00),
    "codestral-2": ModelPricing(0.30, 0.90),
    # MiniMax
    "minimax-m2.5": ModelPricing(0.50, 2.00),
    "minimax-m2.5-lightning": ModelPricing(0.10, 0.40),
    # Moonshot
    "kimi-k2.5": ModelPricing(0.60, 2.50),
    # xAI
    "grok-4": ModelPricing(3.00, 15.00),
    "grok-4-fast": ModelPricing(0.20, 0.50),
    # Cohere
    "command-a": ModelPricing(2.50, 10.00),
    # African models (self-hosted, priced at cost + small margin)
    "inkubalm": ModelPricing(0.05, 0.10),
    "yarngpt": ModelPricing(0.03, 0.08),
    "afrolm": ModelPricing(0.04, 0.08),
    "vulavula": ModelPricing(0.06, 0.12),
    "khaya-ai": ModelPricing(0.04, 0.08),
    "lesan-ai": ModelPricing(0.04, 0.08),
    "sunflower": ModelPricing(0.04, 0.08),
    "afriberta": ModelPricing(0.02, 0.04),
    "afroxlmr": ModelPricing(0.03, 0.06),
    "ethiollm": ModelPricing(0.04, 0.08),
    "swahbert": ModelPricing(0.02, 0.04),
    "ulizallama": ModelPricing(0.05, 0.10),
}

# ── LiteLLM model name mapping ──────────────────────────────────────────
# Maps Mazou model IDs → LiteLLM provider/model format

LITELLM_MODEL_MAP: dict[str, str] = {
    # OpenAI
    "gpt-5.3-codex": "openai/gpt-5.3-codex",
    "gpt-5.2": "openai/gpt-5.2",
    "gpt-5": "openai/gpt-5",
    "o3-pro": "openai/o3-pro",
    "o3-mini": "openai/o3-mini",
    "gpt-4.1": "openai/gpt-4.1",
    "gpt-4.1-mini": "openai/gpt-4.1-mini",
    "gpt-4o": "openai/gpt-4o",
    "gpt-4o-mini": "openai/gpt-4o-mini",
    # Anthropic
    "claude-opus-4.6": "anthropic/claude-opus-4-6-20250214",
    "claude-sonnet-4.6": "anthropic/claude-sonnet-4-6-20250214",
    "claude-haiku-4.5": "anthropic/claude-haiku-4-5-20241022",
    # Google
    "gemini-2.5-pro": "gemini/gemini-2.5-pro",
    "gemini-2.5-flash": "gemini/gemini-2.5-flash",
    "gemini-2.5-flash-lite": "gemini/gemini-2.5-flash-lite",
    # Meta (via Together AI or other host)
    "llama-4-scout": "together_ai/meta-llama/Llama-4-Scout-17B-16E-Instruct",
    "llama-4-maverick": "together_ai/meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    # DeepSeek
    "deepseek-v3.2": "deepseek/deepseek-chat",
    "deepseek-v3.1": "deepseek/deepseek-chat",
    "deepseek-r2": "deepseek/deepseek-reasoner",
    "deepseek-r1": "deepseek/deepseek-reasoner",
    # Mistral
    "mistral-large-2": "mistral/mistral-large-latest",
    "mistral-medium-3.1": "mistral/mistral-medium-latest",
    "codestral-2": "mistral/codestral-latest",
    # MiniMax
    "minimax-m2.5": "openai/MiniMax-M2.5",  # via OpenAI-compatible endpoint
    "minimax-m2.5-lightning": "openai/MiniMax-M2.5-lightning",
    # xAI
    "grok-4": "xai/grok-4",
    "grok-4-fast": "xai/grok-4-fast",
    # Cohere
    "command-a": "cohere_chat/command-a",
}

# ── Provider key mapping ────────────────────────────────────────────────
# Maps provider name → settings attribute for the API key

PROVIDER_KEY_MAP: dict[str, str] = {
    "openai": "openai_api_key",
    "anthropic": "anthropic_api_key",
    "google": "google_api_key",
    "gemini": "google_api_key",
    "deepseek": "deepseek_api_key",
    "mistral": "mistral_api_key",
}


def get_provider_for_model(model_id: str) -> str:
    """Extract provider name from model ID or LiteLLM mapping."""
    litellm_name = LITELLM_MODEL_MAP.get(model_id, "")
    if "/" in litellm_name:
        return litellm_name.split("/")[0]
    return "unknown"


def get_provider_api_key(provider: str) -> str:
    """Get the configured API key for a provider."""
    attr = PROVIDER_KEY_MAP.get(provider, "")
    if attr:
        return getattr(settings, attr, "")
    return ""


def calculate_cost_kobo(
    model_id: str,
    input_tokens: int,
    output_tokens: int,
    fx_rate: int | None = None,
    margin: float | None = None,
) -> int:
    """
    Calculate cost in kobo (integer). Never use floats for final money values.

    Formula: ((input_tokens/1M * input_price) + (output_tokens/1M * output_price))
             * (1 + margin) * fx_rate * 100
    """
    if fx_rate is None:
        fx_rate = settings.fx_rate_ngn_usd
    if margin is None:
        margin = settings.managed_margin

    pricing = MODEL_PRICING.get(model_id, ModelPricing(1.0, 1.0))

    cost_usd = (
        (input_tokens / 1_000_000) * pricing.input_per_1m
        + (output_tokens / 1_000_000) * pricing.output_per_1m
    )

    # Apply margin, convert to Naira, then to kobo
    cost_naira = cost_usd * (1 + margin) * fx_rate
    cost_kobo = int(round(cost_naira * 100))
    return max(cost_kobo, 0)


def estimate_cost_kobo(
    model_id: str,
    input_tokens: int,
    max_output_tokens: int = 4096,
    fx_rate: int | None = None,
) -> int:
    """Estimate cost before making the API call (for pre-flight wallet check)."""
    return calculate_cost_kobo(model_id, input_tokens, max_output_tokens, fx_rate)


def calculate_savings_kobo(
    original_model: str,
    actual_model: str,
    input_tokens: int,
    output_tokens: int,
    fx_rate: int | None = None,
) -> int:
    """Calculate how much was saved by routing to a cheaper model."""
    if original_model == actual_model:
        return 0
    original_cost = calculate_cost_kobo(original_model, input_tokens, output_tokens, fx_rate)
    actual_cost = calculate_cost_kobo(actual_model, input_tokens, output_tokens, fx_rate)
    return max(original_cost - actual_cost, 0)
