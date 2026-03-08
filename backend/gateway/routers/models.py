"""Model catalogue API: /v1/models."""

from __future__ import annotations

from fastapi import APIRouter

from backend.shared.pricing import MODEL_PRICING, LITELLM_MODEL_MAP

router = APIRouter()

# Model metadata catalogue
MODEL_CATALOGUE: dict[str, dict] = {
    # OpenAI
    "gpt-5.3-codex": {"name": "GPT-5.3 Codex", "provider": "OpenAI", "category": "frontier", "tags": ["coding", "reasoning"], "description": "Latest code-specialized model", "context_window": "256K", "released": "2026-01"},
    "gpt-5.2": {"name": "GPT-5.2", "provider": "OpenAI", "category": "frontier", "tags": ["general", "reasoning"], "description": "Enhanced GPT-5 with improved reasoning", "context_window": "256K", "released": "2025-11"},
    "gpt-5": {"name": "GPT-5", "provider": "OpenAI", "category": "frontier", "tags": ["general", "reasoning"], "description": "OpenAI flagship model", "context_window": "128K", "released": "2025-06"},
    "o3-pro": {"name": "O3 Pro", "provider": "OpenAI", "category": "frontier", "tags": ["reasoning", "math"], "description": "Advanced reasoning model", "context_window": "128K", "released": "2025-06"},
    "o3-mini": {"name": "O3 Mini", "provider": "OpenAI", "category": "mid-tier", "tags": ["reasoning"], "description": "Cost-effective reasoning model", "context_window": "128K", "released": "2025-01"},
    "gpt-4.1": {"name": "GPT-4.1", "provider": "OpenAI", "category": "mid-tier", "tags": ["general", "coding"], "description": "Reliable general-purpose model", "context_window": "1M", "released": "2025-04"},
    "gpt-4.1-mini": {"name": "GPT-4.1 Mini", "provider": "OpenAI", "category": "budget", "tags": ["general"], "description": "Fast, affordable GPT-4.1 variant", "context_window": "1M", "released": "2025-04"},
    "gpt-4o": {"name": "GPT-4o", "provider": "OpenAI", "category": "mid-tier", "tags": ["general", "multimodal"], "description": "Multimodal GPT-4 model", "context_window": "128K", "released": "2024-05"},
    "gpt-4o-mini": {"name": "GPT-4o Mini", "provider": "OpenAI", "category": "budget", "tags": ["general"], "description": "Small, fast, affordable", "context_window": "128K", "released": "2024-07"},
    # Anthropic
    "claude-opus-4.6": {"name": "Claude Opus 4.6", "provider": "Anthropic", "category": "frontier", "tags": ["general", "coding", "reasoning"], "description": "Most capable Claude model", "context_window": "200K", "released": "2025-09"},
    "claude-sonnet-4.6": {"name": "Claude Sonnet 4.6", "provider": "Anthropic", "category": "mid-tier", "tags": ["general", "coding"], "description": "Balanced Claude model", "context_window": "200K", "released": "2025-09"},
    "claude-haiku-4.5": {"name": "Claude Haiku 4.5", "provider": "Anthropic", "category": "budget", "tags": ["general", "fast"], "description": "Fastest Claude model", "context_window": "200K", "released": "2024-10"},
    # Google
    "gemini-2.5-pro": {"name": "Gemini 2.5 Pro", "provider": "Google", "category": "frontier", "tags": ["general", "reasoning"], "description": "Google flagship model", "context_window": "1M", "released": "2025-03"},
    "gemini-2.5-flash": {"name": "Gemini 2.5 Flash", "provider": "Google", "category": "budget", "tags": ["general", "fast"], "description": "Fast and affordable Gemini", "context_window": "1M", "released": "2025-04"},
    "gemini-2.5-flash-lite": {"name": "Gemini 2.5 Flash Lite", "provider": "Google", "category": "budget", "tags": ["general", "fast"], "description": "Lightest Gemini model", "context_window": "1M", "released": "2025-05"},
    # Meta
    "llama-4-scout": {"name": "Llama 4 Scout", "provider": "Meta", "category": "mid-tier", "tags": ["general", "open-source"], "description": "Open-weight MoE model", "context_window": "512K", "released": "2025-04"},
    "llama-4-maverick": {"name": "Llama 4 Maverick", "provider": "Meta", "category": "mid-tier", "tags": ["general", "open-source"], "description": "Larger MoE model", "context_window": "256K", "released": "2025-04"},
    # DeepSeek
    "deepseek-v3.2": {"name": "DeepSeek V3.2", "provider": "DeepSeek", "category": "mid-tier", "tags": ["general", "coding"], "description": "Latest DeepSeek chat model", "context_window": "128K", "released": "2025-08"},
    "deepseek-v3.1": {"name": "DeepSeek V3.1", "provider": "DeepSeek", "category": "mid-tier", "tags": ["general", "coding"], "description": "DeepSeek chat model", "context_window": "128K", "released": "2025-03"},
    "deepseek-r2": {"name": "DeepSeek R2", "provider": "DeepSeek", "category": "mid-tier", "tags": ["reasoning"], "description": "DeepSeek reasoning model", "context_window": "128K", "released": "2025-09"},
    "deepseek-r1": {"name": "DeepSeek R1", "provider": "DeepSeek", "category": "mid-tier", "tags": ["reasoning"], "description": "First DeepSeek reasoning model", "context_window": "128K", "released": "2025-01"},
    # Mistral
    "mistral-large-2": {"name": "Mistral Large 2", "provider": "Mistral", "category": "mid-tier", "tags": ["general"], "description": "Mistral flagship model", "context_window": "128K", "released": "2025-07"},
    "mistral-medium-3.1": {"name": "Mistral Medium 3.1", "provider": "Mistral", "category": "mid-tier", "tags": ["general"], "description": "Balanced Mistral model", "context_window": "128K", "released": "2025-05"},
    "codestral-2": {"name": "Codestral 2", "provider": "Mistral", "category": "mid-tier", "tags": ["coding"], "description": "Code-specialized Mistral model", "context_window": "256K", "released": "2025-08"},
    # MiniMax
    "minimax-m2.5": {"name": "MiniMax M2.5", "provider": "MiniMax", "category": "mid-tier", "tags": ["general"], "description": "MiniMax flagship model", "context_window": "128K", "released": "2025-06"},
    "minimax-m2.5-lightning": {"name": "MiniMax M2.5 Lightning", "provider": "MiniMax", "category": "budget", "tags": ["general", "fast"], "description": "Fast MiniMax model", "context_window": "128K", "released": "2025-06"},
    # xAI
    "grok-4": {"name": "Grok 4", "provider": "xAI", "category": "frontier", "tags": ["general", "reasoning"], "description": "xAI frontier model", "context_window": "256K", "released": "2025-10"},
    "grok-4-fast": {"name": "Grok 4 Fast", "provider": "xAI", "category": "budget", "tags": ["general", "fast"], "description": "Fast Grok variant", "context_window": "128K", "released": "2025-10"},
    # Cohere
    "command-a": {"name": "Command A", "provider": "Cohere", "category": "mid-tier", "tags": ["general", "enterprise"], "description": "Cohere enterprise model", "context_window": "256K", "released": "2025-03"},
    # African models
    "inkubalm": {"name": "InkubaLM", "provider": "Lelapa AI", "category": "african", "tags": ["african", "multilingual"], "description": "South African languages (Zulu, Xhosa, Sotho, Afrikaans)", "context_window": "4K", "released": "2024-08", "african_meta": {"languages": ["zu", "xh", "st", "af"], "region": "Southern Africa"}},
    "yarngpt": {"name": "YarnGPT", "provider": "YarnAI", "category": "african", "tags": ["african", "multilingual"], "description": "Nigerian languages (Yoruba, Igbo, Pidgin)", "context_window": "4K", "released": "2024-06", "african_meta": {"languages": ["yo", "ig", "pcm", "ha"], "region": "West Africa"}},
    "afrolm": {"name": "AfroLM", "provider": "AfroAI", "category": "african", "tags": ["african", "multilingual"], "description": "Pan-African multilingual model (23+ African languages)", "context_window": "4K", "released": "2024-03", "african_meta": {"languages": ["ha", "sw", "am", "yo"], "region": "Pan-Africa"}},
    "vulavula": {"name": "Vulavula", "provider": "Lelapa AI", "category": "african", "tags": ["african", "nlu"], "description": "NLU for South African languages", "context_window": "4K", "released": "2024-01", "african_meta": {"languages": ["zu", "xh", "af", "st"], "region": "Southern Africa"}},
    "khaya-ai": {"name": "Khaya AI", "provider": "Khaya", "category": "african", "tags": ["african", "translation"], "description": "Translation for West African languages", "context_window": "4K", "released": "2024-04", "african_meta": {"languages": ["yo", "ha", "ig", "tw"], "region": "West Africa"}},
    "lesan-ai": {"name": "Lesan AI", "provider": "Lesan", "category": "african", "tags": ["african", "translation"], "description": "East African language translation", "context_window": "4K", "released": "2024-02", "african_meta": {"languages": ["am", "ti", "om"], "region": "East Africa"}},
    "swahbert": {"name": "SwahBERT", "provider": "Community", "category": "african", "tags": ["african", "nlu"], "description": "Swahili language model", "context_window": "4K", "released": "2023-06", "african_meta": {"languages": ["sw"], "region": "East Africa"}},
    "afriberta": {"name": "AfriBERTa", "provider": "Community", "category": "african", "tags": ["african", "nlu"], "description": "Multilingual African BERT model", "context_window": "4K", "released": "2023-01", "african_meta": {"languages": ["yo", "ha", "ig", "sw", "am"], "region": "Pan-Africa"}},
    "ethiollm": {"name": "EthioLLM", "provider": "Community", "category": "african", "tags": ["african", "multilingual"], "description": "Ethiopian languages (Amharic, Tigrinya, Oromo)", "context_window": "4K", "released": "2024-05", "african_meta": {"languages": ["am", "ti", "om"], "region": "East Africa"}},
    "ulizallama": {"name": "UlizaLlama", "provider": "Community", "category": "african", "tags": ["african", "general"], "description": "Fine-tuned Llama for African contexts", "context_window": "8K", "released": "2024-07", "african_meta": {"languages": ["sw", "yo", "ha"], "region": "Pan-Africa"}},
}

AFRICAN_MODEL_IDS = {k for k, v in MODEL_CATALOGUE.items() if v.get("category") == "african"}


@router.get("/models")
async def list_models(
    is_african: bool | None = None,
    category: str | None = None,
    tag: str | None = None,
    provider: str | None = None,
):
    """List available models with pricing and metadata."""
    results = []
    for model_id, meta in MODEL_CATALOGUE.items():
        pricing = MODEL_PRICING.get(model_id)
        if not pricing:
            continue

        if is_african is True and model_id not in AFRICAN_MODEL_IDS:
            continue
        if is_african is False and model_id in AFRICAN_MODEL_IDS:
            continue
        if category and meta.get("category") != category:
            continue
        if tag and tag not in meta.get("tags", []):
            continue
        if provider and meta.get("provider", "").lower() != provider.lower():
            continue

        results.append({
            "id": model_id,
            "name": meta["name"],
            "provider": meta["provider"],
            "category": meta["category"],
            "tags": meta.get("tags", []),
            "description": meta.get("description", ""),
            "context_window": meta.get("context_window", "N/A"),
            "input_cost_usd_per_1m": pricing.input_per_1m,
            "output_cost_usd_per_1m": pricing.output_per_1m,
            "is_african": model_id in AFRICAN_MODEL_IDS,
            "african_meta": meta.get("african_meta"),
            "released": meta.get("released", ""),
            "litellm_id": LITELLM_MODEL_MAP.get(model_id),
        })

    return {"data": results, "count": len(results)}


@router.get("/models/{model_id}")
async def get_model(model_id: str):
    """Get details for a specific model."""
    meta = MODEL_CATALOGUE.get(model_id)
    if not meta:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Model '{model_id}' not found")

    pricing = MODEL_PRICING.get(model_id)
    return {
        "id": model_id,
        "name": meta["name"],
        "provider": meta["provider"],
        "category": meta["category"],
        "tags": meta.get("tags", []),
        "description": meta.get("description", ""),
        "context_window": meta.get("context_window", "N/A"),
        "input_cost_usd_per_1m": pricing.input_per_1m if pricing else None,
        "output_cost_usd_per_1m": pricing.output_per_1m if pricing else None,
        "is_african": model_id in AFRICAN_MODEL_IDS,
        "african_meta": meta.get("african_meta"),
        "released": meta.get("released", ""),
        "litellm_id": LITELLM_MODEL_MAP.get(model_id),
    }
