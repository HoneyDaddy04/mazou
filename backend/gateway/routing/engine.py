"""
Smart routing engine (v1: rule-based).
Decides which model to use for each request based on language, budget, complexity, and org rules.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field

from supabase import Client

from backend.shared.pricing import LITELLM_MODEL_MAP, get_provider_for_model

# ── Language detection (lightweight) ─────────────────────────────────────
# Use simple keyword detection for v1. Upgrade to lingua-py when installed.

AFRICAN_LANGUAGE_PATTERNS: dict[str, list[str]] = {
    "yo": ["bawo ni", "e kaaro", "se alaafia ni", "omo", "oluwa", "jowo", "ko si wahala"],
    "ha": ["ina kwana", "sannu", "yaya dai", "allah ya", "ina gajiya", "na gode"],
    "ig": ["kedu", "ndewo", "biko", "nnoo", "chineke", "dalu"],
    "pcm": ["wetin", "dey", "wahala", "abeg", "oga", "chop", "na so", "how far"],
    "sw": ["habari", "jambo", "asante", "karibu", "hakuna matata", "pole"],
    "zu": ["sawubona", "ngiyabonga", "yebo", "nkosi", "umuntu"],
}

AFRICAN_LANGUAGE_MODEL_MAP: dict[str, str] = {
    "yo": "yarngpt",
    "ha": "afrolm",
    "ig": "yarngpt",
    "pcm": "yarngpt",
    "sw": "swahbert",
    "zu": "inkubalm",
}


def detect_african_language(text: str) -> str | None:
    """Simple keyword-based African language detection. Returns lang code or None."""
    text_lower = text.lower()
    best_lang = None
    best_count = 0

    for lang_code, keywords in AFRICAN_LANGUAGE_PATTERNS.items():
        count = sum(1 for kw in keywords if kw in text_lower)
        if count > best_count and count >= 2:  # Require at least 2 keyword matches
            best_count = count
            best_lang = lang_code

    return best_lang


# ── Task classification (keyword-based) ──────────────────────────────────

CODE_PATTERNS = re.compile(
    r"```|def\s+\w+|function\s+\w+|class\s+\w+|import\s+\w+|"
    r"fix\s+(this|the)\s+bug|write\s+a?\s*function|syntax\s+error|traceback",
    re.IGNORECASE,
)
TRANSLATION_PATTERNS = re.compile(r"translate\s+to|in\s+yoruba|in\s+hausa|convert\s+to\s+english", re.IGNORECASE)
SUMMARY_PATTERNS = re.compile(r"summar|tldr|key\s+points|brief\s+overview", re.IGNORECASE)


def classify_task(text: str) -> str:
    """Classify the task type from the prompt. Returns category string."""
    if CODE_PATTERNS.search(text):
        return "coding"
    if TRANSLATION_PATTERNS.search(text):
        return "translation"
    if SUMMARY_PATTERNS.search(text):
        return "summarisation"
    return "general"


# ── Complexity scoring ───────────────────────────────────────────────────


def estimate_complexity(text: str) -> str:
    """Estimate prompt complexity: simple | medium | complex."""
    word_count = len(text.split())
    if word_count < 30:
        return "simple"
    if word_count < 200:
        return "medium"
    return "complex"


# ── Budget-based model selection ─────────────────────────────────────────

BUDGET_MODELS: dict[str, str] = {
    "low": "gemini-2.5-flash",
    "medium": "gpt-5",
    "high": "gpt-5",
    "unlimited": "claude-opus-4.6",
}

SIMPLE_QUERY_MODELS: dict[str, str] = {
    "low": "claude-haiku-4.5",
    "medium": "gemini-2.5-flash",
    "high": "gpt-4.1-mini",
}


# ── Routing result ───────────────────────────────────────────────────────


@dataclass
class RoutingResult:
    model: str
    litellm_model_name: str
    provider: str
    was_routed: bool
    reason: str | None = None
    routed_from: str | None = None


# ── Main routing function ────────────────────────────────────────────────


def apply_routing(
    org_id: str,
    requested_model: str,
    messages: list[dict],
    budget: str | None,
    db: Client | None = None,
) -> RoutingResult:
    """
    Routing decision flow (rule-based v1):
    1. If model is explicitly specified (not "auto") -> use it
    2. Language detection -> route African languages to African models
    3. Budget + complexity -> select appropriate model
    4. Org-specific rules from DB
    5. Default fallback
    """

    # 1. Explicit model selection (no routing)
    if requested_model != "auto" and requested_model in LITELLM_MODEL_MAP:
        return RoutingResult(
            model=requested_model,
            litellm_model_name=LITELLM_MODEL_MAP[requested_model],
            provider=get_provider_for_model(requested_model),
            was_routed=False,
        )

    # Extract user text from messages
    user_text = " ".join(
        m["content"] if isinstance(m["content"], str) else str(m["content"])
        for m in messages
        if m.get("role") == "user"
    )

    # 2. Language detection
    detected_lang = detect_african_language(user_text)
    if detected_lang:
        african_model = AFRICAN_LANGUAGE_MODEL_MAP.get(detected_lang, "yarngpt")
        litellm_name = LITELLM_MODEL_MAP.get(african_model, f"custom/{african_model}")
        return RoutingResult(
            model=african_model,
            litellm_model_name=litellm_name,
            provider="african",
            was_routed=True,
            reason=f"African language detected ({detected_lang}), routing to {african_model}",
            routed_from=requested_model,
        )

    # 3. Budget + complexity routing
    complexity = estimate_complexity(user_text)
    budget = budget or "medium"

    if complexity == "simple" and budget in ("low", "medium"):
        model = SIMPLE_QUERY_MODELS.get(budget, "claude-haiku-4.5")
        return RoutingResult(
            model=model,
            litellm_model_name=LITELLM_MODEL_MAP.get(model, f"openai/{model}"),
            provider=get_provider_for_model(model),
            was_routed=True,
            reason=f"Simple query (budget={budget}), using lightweight model",
            routed_from=requested_model,
        )

    # 4. Org-specific rules from DB
    if db:
        result = (
            db.table("routing_rules")
            .select("*")
            .eq("org_id", org_id)
            .eq("status", "active")
            .order("priority", desc=True)
            .execute()
        )
        rules = result.data or []

        for rule in rules:
            try:
                condition = json.loads(rule["condition"]) if isinstance(rule["condition"], str) else rule["condition"]
                action = json.loads(rule["action"]) if isinstance(rule["action"], str) else rule["action"]
            except (json.JSONDecodeError, TypeError):
                continue

            if _evaluate_condition(condition, budget, user_text, complexity):
                target_model = action.get("target_model", "gpt-5")
                if target_model in LITELLM_MODEL_MAP:
                    return RoutingResult(
                        model=target_model,
                        litellm_model_name=LITELLM_MODEL_MAP[target_model],
                        provider=get_provider_for_model(target_model),
                        was_routed=True,
                        reason=f"Rule matched: {rule['name']}",
                        routed_from=requested_model,
                    )

    # 5. Budget-based default
    model = BUDGET_MODELS.get(budget, "gpt-5")
    return RoutingResult(
        model=model,
        litellm_model_name=LITELLM_MODEL_MAP.get(model, "openai/gpt-5"),
        provider=get_provider_for_model(model),
        was_routed=requested_model == "auto",
        reason=f"Default model for budget={budget}" if requested_model == "auto" else None,
        routed_from=requested_model if requested_model == "auto" else None,
    )


def _evaluate_condition(
    condition: dict,
    budget: str | None,
    user_text: str,
    complexity: str,
) -> bool:
    """Evaluate a routing rule condition against the current request."""
    if condition.get("always"):
        return True

    if "budget" in condition and condition["budget"] != budget:
        return False

    if "tokens_lt" in condition:
        word_count = len(user_text.split())
        estimated_tokens = int(word_count * 1.3)
        if estimated_tokens >= condition["tokens_lt"]:
            return False

    if "complexity" in condition and condition["complexity"] != complexity:
        return False

    if "language_in" in condition:
        detected = detect_african_language(user_text)
        if detected not in condition["language_in"]:
            return False

    return True
