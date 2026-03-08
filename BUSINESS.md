# Mazou — Business & Technical Overview

> The AI infrastructure layer for Africa. One API key, every major LLM, pay in Naira.

---

## What Mazou Is

Mazou is an **AI gateway and cost management platform** purpose-built for the African market. Developers and businesses get a single API key that gives them access to every major AI model (GPT, Claude, Gemini, DeepSeek, Mistral, and African-language models) — billed in Naira via a prepaid wallet, with smart routing that automatically picks the best model for each request.

Think **OpenRouter or AWS Bedrock, but for Africa** — Naira billing, Paystack integration, African language support, and cost optimization built in.

---

## The Problem

African developers and businesses face three barriers when building with AI:

1. **Payment friction** — Most AI providers (OpenAI, Anthropic, Google) only accept USD credit cards. Many African developers don't have international cards. Those who do face FX fees, failed transactions, and unpredictable billing.

2. **Complexity** — Using multiple AI models means managing multiple API keys, multiple billing accounts, multiple SDKs, and multiple provider dashboards. Most teams default to one provider and overpay.

3. **No local optimization** — No existing gateway understands African languages (Yoruba, Hausa, Igbo, Swahili) or can route requests to models that handle them well. African developers get no cost visibility in their local currency.

---

## How Mazou Solves This

### For Developers (API Users)

1. **Sign up** at mazou.io — get a dashboard
2. **Fund wallet** in Naira via Paystack (bank transfer, card, USSD)
3. **Generate one API key** (`mz_live_abc123...`)
4. **Use it everywhere** — drop-in replacement for OpenAI's API format:

```python
import openai

client = openai.OpenAI(
    base_url="https://api.mazou.io/v1",
    api_key="mz_live_abc123..."
)

response = client.chat.completions.create(
    model="gpt-4o",        # or "claude-sonnet-4", "gemini-2.5-pro", or "auto"
    messages=[{"role": "user", "content": "Explain quantum computing"}]
)
```

That's it. No OpenAI account needed. No USD credit card. No multiple SDKs. One key, any model, pay in Naira.

### For Non-Technical Users

Same API key works with any app that accepts an "OpenAI-compatible" API. Many no-code tools, chatbot builders, and AI wrappers support custom API base URLs. Users paste their Mazou key and base URL — done.

---

## Revenue Model

### How Money Flows

```
User funds wallet (Naira, prepaid via Paystack)
    -> User makes API request
        -> Mazou calls the AI provider using Mazou's own provider API key
        -> Provider bills Mazou (USD, post-paid on credit card)
        -> Mazou debits user's wallet (Naira, with 15% margin applied)
```

### Unit Economics (per request)

| Step | Example |
|------|---------|
| Provider charges Mazou | $0.01 USD (per-token, post-paid) |
| Mazou converts to Naira | 0.01 x 1,580 = 15.80 NGN |
| Mazou adds 15% margin | 15.80 x 1.15 = **18.17 NGN** |
| User's wallet debited | 1,817 kobo |
| **Mazou gross profit** | **2.37 NGN per request** (the 15% margin) |

### Why This Works Financially

- **Users pay upfront** (prepaid wallet) — Mazou is never out of pocket
- **Providers bill monthly** (post-paid) — Mazou collects before it pays
- **Positive cash flow from day one** — no credit risk, no receivables
- **FX margin built in** — the 15% covers Naira/USD fluctuation + profit
- **No minimum commitment** — users top up any amount, use as needed

### Revenue Streams

| Stream | Mechanism | Margin |
|--------|-----------|--------|
| **Managed mode** (primary) | User pays Naira, Mazou pays provider in USD | 15% default, configurable per plan |
| **BYOK mode** (secondary) | User brings own provider keys, pays Mazou for routing/analytics | Platform fee (flat monthly or per-request) |
| **Enterprise plans** | Custom SLAs, dedicated support, higher rate limits | Higher margins |
| **Smart routing savings share** | Mazou routes to cheaper model, splits savings with user | Implicit (lower cost = higher margin) |

---

## Two Operating Modes

### 1. Managed Mode (Default)

Mazou holds API keys for each AI provider (OpenAI, Anthropic, Google, etc.). Users access all models through their single Mazou key. Mazou pays the providers and bills users in Naira with a markup.

**What Mazou needs:** API accounts at each provider (OpenAI, Anthropic, Google, etc.) with a credit card on file. Sign up at each provider's developer portal, get an API key, add it to the platform config.

**Scaling:** Start with 2-3 providers (OpenAI + Anthropic covers 80% of demand). Add providers based on user requests. Each new provider = one API key in config, zero code changes.

**Provider cost structure:**
- All major providers (OpenAI, Anthropic, Google) offer pay-as-you-go API access
- No minimum spend, no upfront commitment
- Billed monthly based on actual token usage
- Volume discounts available at scale (negotiate as usage grows)

### 2. BYOK Mode (Bring Your Own Keys)

Power users who already have their own provider API keys can store them in Mazou. They still use one Mazou API key for all requests, but the gateway uses their provider keys instead of Mazou's. Their wallet is not debited for provider costs.

**Why users still pay Mazou in BYOK mode:**
- Smart routing and model selection
- Cost analytics and optimization dashboard
- Usage tracking across all providers in one place
- African language routing
- Fallback chains (if one provider is down, auto-switch)

**Revenue in BYOK mode:** Platform fee — either monthly subscription or small per-request fee for the routing/analytics layer.

---

## Smart Routing — The Differentiator

When a user sends `"model": "auto"`, Mazou's routing engine picks the best model based on:

| Factor | How It Works |
|--------|-------------|
| **Language** | Detects Yoruba, Hausa, Igbo, Swahili, etc. and routes to models trained on African languages |
| **Budget** | User sets `"budget": "low"` — routes to cheapest capable model (e.g., Gemini Flash instead of GPT-4o) |
| **Complexity** | Short simple queries go to fast/cheap models, complex queries go to frontier models |
| **Custom rules** | Org-specific routing rules (e.g., "all customer support queries use Claude Haiku") |
| **Fallback** | If primary model times out or errors, automatically retries with next-best model |

**Why this matters for margins:** Smart routing naturally steers traffic toward cheaper models when quality isn't sacrificed. A request that would cost $0.03 on GPT-4o might cost $0.002 on Gemini Flash — if the output quality is equivalent, Mazou can charge closer to the GPT-4o price while paying the Flash price. This is where margins expand beyond the base 15%.

---

## Market Opportunity

### Target Customers

| Segment | Use Case | Example |
|---------|----------|---------|
| **Startups** | Building AI features into their products | Fintech adding AI customer support |
| **Enterprises** | Multi-model AI strategy without vendor lock-in | Bank using Claude for analysis, GPT for generation |
| **Developers** | Side projects, experiments, freelance work | Developer building a chatbot for a client |
| **No-code builders** | AI-powered apps via tools that accept custom API URLs | Business owner using AI in their workflow |
| **Government/NGOs** | African language AI applications | Education tools in Yoruba, health info in Swahili |

### Why Africa, Why Now

- AI adoption in Africa is accelerating — developers need infrastructure
- Payment is the #1 blocker — Mazou removes it completely
- No established competitor in the "AI gateway for Africa" space
- African language AI models are emerging — Mazou is positioned to be the routing layer
- Nigeria alone has 500K+ software developers, growing 50%+ annually

---

## Competitive Landscape

| Player | What They Do | Why Mazou Wins |
|--------|-------------|----------------|
| **OpenRouter** | Multi-model gateway, USD only | No Naira billing, no African language routing, no Paystack |
| **AWS Bedrock** | Enterprise multi-model, USD | Complex setup, enterprise pricing, no African focus |
| **Azure OpenAI** | Microsoft's OpenAI wrapper | Single provider (OpenAI only), enterprise-focused, USD |
| **Direct provider APIs** | OpenAI, Anthropic, Google directly | USD-only billing, separate accounts per provider |
| **Paystack** (analogy) | Didn't compete with Stripe — built payments for Africa | Mazou doesn't compete with OpenRouter — builds AI infra for Africa |

---

## Technical Architecture (Summary)

```
User's App
    |
    | one API key (mz_live_...)
    v
Mazou Gateway (FastAPI + LiteLLM)
    |
    |-- Auth & Rate Limiting
    |-- Smart Routing Engine
    |-- Wallet Check (sufficient balance?)
    |
    v
AI Providers (OpenAI, Anthropic, Google, DeepSeek, Mistral, African models)
    |
    v
Response -> Cost Calculation -> Wallet Debit -> Usage Log -> Return to User
```

**Key technical facts:**
- **OpenAI-compatible API** — any app that works with OpenAI works with Mazou (zero code change, just swap base URL and key)
- **30 API endpoints** built and tested (198 automated tests passing)
- **Atomic wallet operations** — concurrent requests can't overdraw the wallet (verified under stress testing with 50 concurrent debits)
- **Sub-50ms latency overhead** — Mazou adds minimal latency on top of the provider's response time
- **40+ AI models** catalogued with real-time pricing in Naira

---

## Go-to-Market

### Phase 1: Developer Launch
- Open beta with Nigerian developer communities
- Free credits on signup (funded by Mazou)
- Target: 100 developers, validate demand and unit economics

### Phase 2: Startup Adoption
- Outreach to YC-backed African startups, Techstars Lagos alumni
- Integration guides for popular frameworks (LangChain, Vercel AI SDK)
- Target: 20 paying startups

### Phase 3: Enterprise
- Custom plans with SLAs
- On-premise deployment option
- SOC 2 compliance
- Target: 5 enterprise contracts

---

## Key Metrics to Track

| Metric | What It Tells You |
|--------|------------------|
| **GMV (Gross Merchandise Volume)** | Total Naira flowing through the platform |
| **Net Revenue** | GMV x margin (15%+) |
| **Monthly Active API Keys** | How many keys are making requests |
| **Requests per Day** | Platform usage velocity |
| **Average Wallet Balance** | Prepaid float (your interest-free capital) |
| **Provider Cost Ratio** | What you pay providers vs what users pay you |
| **Smart Routing Savings** | How much cheaper smart routing is vs user's default model choice |
| **Churn Rate** | % of orgs that stop making requests |

---

## FAQ for Investors

**Q: Do you need to pre-buy tokens or capacity from AI providers?**
No. All major providers (OpenAI, Anthropic, Google) offer pay-as-you-go API access. Mazou signs up for API accounts, gets keys, and pays based on actual usage. No upfront inventory, no minimum commitments. Users pay Mazou upfront (prepaid), providers bill Mazou monthly (post-paid). Positive cash flow from day one.

**Q: What happens if a provider raises prices?**
Mazou's pricing table is configurable. Price increases are passed through to users (with notice), or absorbed if the margin allows. The 15% margin provides buffer for small fluctuations. Smart routing also mitigates this — if OpenAI raises prices, routing shifts traffic to cheaper alternatives.

**Q: What's the FX risk?**
Users pay in Naira, providers charge in USD. The FX rate is configured in the platform and updated regularly. The 15% margin covers typical NGN/USD fluctuation. For large movements, the rate is adjusted. Since users prepay and providers bill monthly, Mazou has a window to manage FX exposure.

**Q: Can users bypass Mazou and go directly to providers?**
Yes, technically. But they'd need USD credit cards, separate accounts at each provider, no smart routing, no cost analytics, no Naira billing, and no unified dashboard. Mazou's value is convenience + cost optimization + local payment — similar to why businesses use Paystack instead of integrating with Visa/Mastercard directly.

**Q: What if a provider blocks or rate-limits Mazou's API key?**
Each provider has usage tiers. As Mazou scales, we negotiate enterprise API agreements with higher limits. We can also distribute load across multiple API keys per provider. The fallback routing engine automatically handles individual provider outages.

**Q: How defensible is this?**
Three moats: (1) **Payment infrastructure** — Paystack integration, Naira wallet, local compliance are hard to replicate from outside Africa. (2) **African language routing** — specialized models and routing rules for Yoruba, Hausa, Igbo, Swahili that global players don't prioritize. (3) **Network effects** — more usage = better routing data = smarter model selection = lower costs = more users.

**Q: What does the team need to launch?**
The backend is built and tested (198 automated tests, including security and stress tests). To launch: (1) Sign up for 2-3 provider API accounts (~30 min). (2) Get a real Paystack API key. (3) Deploy to a cloud server. (4) Point a domain at it. Technically ready for beta users today.
