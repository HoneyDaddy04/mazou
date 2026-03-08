# MAZOU — Complete Product Highlights

**One API. Every model. Pay in local currency. Waste nothing.**

Mazou is the AI infrastructure and cost management layer for Africa. It gives developers and companies a single control plane for every AI model, every agent, every service — with full cost visibility, smart optimisation, and local currency billing.

---

## CORE

1. **Single API gateway** — One unified API for all top global providers (OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, Cohere) and African LLMs, through a single endpoint
2. **Full spend visibility** — Track exactly how much each AI call, feature, agent, model, or activity type costs in real time
3. **African LLMs** — Access LLMs fine-tuned for African context — not just language, but cultural understanding, regional knowledge, local business patterns, and domain expertise (healthcare, finance, agriculture, etc.)
4. **Pay in local currencies** — Fund your wallet in Naira, Cedis, Rand, Kenyan Shillings, Rwandan Francs, Ethiopian Birr, USDT, or any local African currency via Paystack, Stripe, or crypto — no USD card needed
5. **Smart routing** — Auto-routes each request to the cheapest or most effective model that meets your quality bar, saving 15–40% on AI spend from day one
6. **One-click optimisations** — Actionable recommendations (model downgrades, caching, batching, swapping to African models) with estimated savings and instant apply

---

## AGENT MANAGEMENT & MONITORING

7. **AI agent tracking** — Monitor live AI agents with per-agent cost, call volume, error rates, uptime, task counts, and model assignments
8. **Agent cost attribution** — Know exactly how much each agent (support bot, fraud detector, onboarding assistant, compliance reviewer, etc.) costs you per month
9. **Activity-level cost tracking** — Every action an agent takes is classified and tracked — so you can see which types of activities (FAQ handling, fraud checks, document extraction, translation, search queries, etc.) consume the most tokens and cost the most money
10. **Agent trend analysis** — Month-over-month cost and usage trends per agent, so you can spot runaway spend before it becomes a problem

---

## AGENT SERVICES & WALLETS (Future / v2)

11. **Agent wallets via Coinbase** — Agents get their own crypto wallets (USDT) with daily spending limits, auto-top-up, and transaction tracking — enabling autonomous agent-to-service payments
12. **Stripe Agent Commerce** — Agents can purchase external services (risk data, verification, commerce APIs) through Stripe-connected accounts, with full cost visibility inside Mazou
13. **Agent web search** — Agents can pay for and use search APIs (e.g., Exa) to find information, with every search query cost-tracked
14. **Cloudflare content access** — Agents can fetch and read web page content via Cloudflare's infrastructure (markdown fetch, content access), enabling agents to browse the web with cost tracked per fetch
15. **Unified service billing** — LLM costs, agent wallet spend, search costs, commerce purchases, and content access fees all appear in the same dashboard with the same billing and visibility
16. **Agent wallet transaction log** — Real-time feed of every autonomous payment an agent makes: what it paid for, which wallet was used, how much it cost, and what protocol was used

---

## SMART ROUTING ENGINE

17. **Language detection routing** — Automatically detects Yoruba, Hausa, Igbo, Pidgin, Swahili and routes to African models that outperform global ones by up to 40% on those tasks
18. **Budget-based routing** — Set "low", "balanced", or "quality" and let the engine pick the best model for each request
19. **Complexity-based routing** — Simple queries (short FAQs, basic summaries) get downgraded to cheaper models automatically
20. **Response caching** — Deduplicates repeated queries, eliminates redundant API calls entirely
21. **Batch processing** — Groups similar requests for bulk processing at reduced per-call cost
22. **Latency fallback** — If a model times out, auto-switches to the next best option instantly
23. **Quality gates** — Won't downgrade if quality drops more than the savings justify — protects output integrity

---

## BILLING & PAYMENTS

24. **Multi-currency wallets** — Separate wallets for NGN, USDT, USD, EUR, GBP, ZAR, GHS, KES, BTC, ETH — each with its own balance and burn rate
25. **USDT wallet** — Stablecoin wallet (TRC-20 / ERC-20) specifically for agent services and cross-border payments
26. **Crypto payments** — Fund via BTC (on-chain or Lightning Network) and ETH
27. **Paystack integration** — Native Naira funding via Africa's leading payment processor
28. **Stripe integration** — USD, EUR, GBP funding via Stripe
29. **Auto-fund** — Set a threshold, wallet tops up automatically when balance runs low
30. **Burn rate & runway** — See your daily spend rate and how many days your balance will last at current usage
31. **Transaction history** — Full ledger of credits and debits with payment references
32. **Monthly invoicing** — Downloadable invoices in your local currency

---

## ANALYTICS & REPORTING

33. **Spend by feature** — Tag API calls by product feature (support bot, fraud detection, OCR, etc.) and see cost breakdowns
34. **Spend by model** — Compare costs across all 19+ models with latency, call volume, and usage percentage
35. **Spend by agent** — Per-agent financial performance and health
36. **Spend by activity type** — See which types of actions (FAQ answering, translation, summarisation, search, verification) are most expensive across your entire AI stack
37. **Live routing feed** — Real-time stream showing every routing decision: what was routed, why, what model was bypassed, and how much was saved
38. **Service usage tracking** — Track non-LLM services (Coinbase wallets, Stripe commerce, search APIs) alongside model spend in the same dashboard
39. **Trend analysis** — Month-over-month comparisons on spend, calls, savings, and efficiency

---

## DEVELOPER EXPERIENCE

40. **OpenAI-compatible API** — Drop-in replacement; works with existing SDKs. Just change the base URL
41. **Python SDK** — `from mazou import AI` with parameters for model, budget, and feature tagging
42. **Auto model selection** — Set `model="auto"` and let Mazou pick the best model per request
43. **Feature tagging** — Tag every API call with a feature name (`tag="support-bot"`) for granular cost attribution
44. **Bring Your Own Keys (BYOK)** — Connect your existing OpenAI/Anthropic/Google/Mistral/DeepSeek keys and get the routing + visibility layer on top — zero switching cost
45. **Managed service** — Or let Mazou hold the keys — one local currency invoice, no separate provider accounts needed
46. **API key management** — Generate production, staging, and dev keys with usage tracking, masking, and revocation
47. **Response headers** — Every response includes `X-Mazou` headers showing which model was used, cost, latency, and routing decision

---

## AFRICAN MODEL CATALOGUE

48. **9+ African models integrated** — covering NLP, speech, translation, embeddings, and benchmarking:
    - **InkubaLM** (Lelapa AI) — Multilingual LLM, 0.4B params. Swahili, Yoruba, isiXhosa, Hausa, isiZulu
    - **YarnGPT / SabiYarn** — Nigerian multilingual model. Yoruba, Hausa, Igbo, Pidgin text generation
    - **AfroLM** — 23 African languages. NER, sentiment analysis, text classification
    - **Vulavula** (Lelapa AI) — NLP platform for Global South. isiZulu, Sesotho, Afrikaans
    - **Khaya AI** (GhanaNLP) — Translation & ASR for West Africa. Twi, Ewe, Ga, Dagbani
    - **Lesan AI** — Machine translation for Ethiopian/Eritrean languages. Tigrinya, Amharic
    - **Sunflower** (Sunbird AI) — Open-source LLM for 31 Ugandan languages
    - **AfriBERTa** (Masakhane) — Pretrained embeddings for 11 African languages
    - **UlizaLlama** (Jacaranda Health) — 7B LLM fine-tuned on 321M Swahili tokens for maternal health
49. **One-click activation** — Browse the catalogue, activate a model, and it's immediately available through your API
50. **Quality benchmarking** — African models benchmarked against global models on local-context tasks (AfriMMLU, AfriXnli) with quality scores displayed

---

## TEAM & SECURITY

51. **Team management** — Roles: Owner, Admin, Member, Viewer with organisation-based multi-tenancy
52. **Plan tiers** — Free, Growth, Enterprise
53. **Encrypted key storage** — BYOK keys encrypted at rest, API keys SHA-256 hashed
54. **Webhook security** — HMAC-SHA512 validation on payment webhooks
55. **Session security** — httpOnly cookies, secure flag in production, 30-day expiration

---

## POSITIONING & VISION

56. **"AI spend is the new cloud spend"** — Mazou exists because AI costs are following the same trajectory as cloud costs in Africa — starting small, growing fast, and becoming unmanageable without infrastructure
57. **The control plane you can't rip out** — As agents need wallets, web search, commerce, and content access, those services all plug into the same Mazou interface — same billing, same visibility — making Mazou the indispensable layer
58. **Paystack for AI** — "Paystack built the payment rails for Africa's internet economy. Mazou is building the token rails for Africa's AI economy."
59. **Mazou** — The name comes from Hausa-speaking West Africa, meaning "honour", "dignity", "respect"

---

## FUTURE ROADMAP

- **Coinbase Agent Wallets** — Full integration with Coinbase's agent wallet infrastructure for autonomous AI agent payments
- **Stripe Agent Commerce** — Integration with Stripe's agent commerce tools for agents that need to make purchases
- **Cloudflare agent protocol** — Integration with Cloudflare's infrastructure for agents to read and access web content programmatically
- **Expanded African model catalogue** — Continuous addition of new African LLMs as the ecosystem grows
- **Agent-to-agent payments** — Agents paying other agents for services through standardised protocols
- **More local currencies** — Expanding beyond current supported currencies to cover all major African economies
- **Vertical-specific models** — African models for healthcare (maternal health, diagnostics), finance (fraud, credit scoring), agriculture, education
- **MCP / standardised protocol support** — Standardised integration patterns for agents to discover and use external services
