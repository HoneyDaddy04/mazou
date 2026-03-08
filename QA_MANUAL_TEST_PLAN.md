# Mazou Backend — Manual QA Test Plan

**Version:** 1.0
**Date:** March 2, 2026
**Total Test Cases:** 72
**Estimated Time:** 2–3 hours

---

## Table of Contents

1. [Setup & Prerequisites](#1-setup--prerequisites)
2. [TC-AUTH: Authentication (8 cases)](#2-tc-auth-authentication)
3. [TC-KEYS: API Key Management (6 cases)](#3-tc-keys-api-key-management)
4. [TC-WALLET: Wallet & Billing (6 cases)](#4-tc-wallet-wallet--billing)
5. [TC-GATEWAY: Chat Completions Gateway (10 cases)](#5-tc-gateway-chat-completions-gateway)
6. [TC-MODELS: Model Catalog (4 cases)](#6-tc-models-model-catalog)
7. [TC-USAGE: Usage Analytics (4 cases)](#7-tc-usage-usage-analytics)
8. [TC-DASH: Dashboard (5 cases)](#8-tc-dash-dashboard)
9. [TC-ROUTING: Routing Rules (5 cases)](#9-tc-routing-routing-rules)
10. [TC-BYOK: Bring Your Own Keys (6 cases)](#10-tc-byok-bring-your-own-keys)
11. [TC-ADMIN: Admin Portal (10 cases)](#11-tc-admin-admin-portal)
12. [TC-WEBHOOK: Paystack Webhooks (3 cases)](#12-tc-webhook-paystack-webhooks)
13. [TC-SEC: Security & Edge Cases (5 cases)](#13-tc-sec-security--edge-cases)
14. [Appendix: Environment Variables](#appendix-environment-variables)

---

## 1. Setup & Prerequisites

### Environment

| Item | Value |
|------|-------|
| Backend URL | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/docs` |
| Frontend URL | `http://localhost:3000` |

### Start the Backend

```bash
# From project root
PYTHONPATH=. python -m uvicorn backend.gateway.main:app --reload
```

### Start the Frontend (optional)

```bash
cd app && npm run dev
```

### Tools Required

- **Postman** or **curl** (examples use curl below)
- A browser for Swagger UI testing
- Access to the database (SQLite browser or `sqlite3` CLI for dev)

### Test Accounts

Create these before starting. All passwords should be `TestPass123!`.

| Account | Email | Purpose |
|---------|-------|---------|
| Primary User | `qa-user@test.com` | Main test account |
| Secondary User | `qa-user2@test.com` | Cross-org isolation tests |
| Superadmin | `demo@mazou.io` | Admin portal tests (already seeded) |

### Variables to Track

As you run tests, record these values — later tests depend on them.

| Variable | Value | Set By |
|----------|-------|--------|
| `SESSION_COOKIE` | _(from login)_ | TC-AUTH-02 |
| `LIVE_API_KEY` | _(from key create)_ | TC-KEYS-01 |
| `TEST_API_KEY` | _(from key create)_ | TC-KEYS-02 |
| `KEY_ID` | _(from key create)_ | TC-KEYS-01 |
| `ORG_ID` | _(from /me)_ | TC-AUTH-04 |
| `BYOK_KEY_ID` | _(from BYOK create)_ | TC-BYOK-01 |
| `RULE_ID` | _(from routing create)_ | TC-ROUTING-02 |
| `ADMIN_COOKIE` | _(from admin login)_ | TC-ADMIN-01 |

---

## 2. TC-AUTH: Authentication

### TC-AUTH-01: Signup — Happy Path

**Priority:** P0

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "qa-user@test.com",
    "password": "TestPass123!",
    "full_name": "QA Tester",
    "org_name": "QA Org"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | `{"user": {"id": "...", "email": "qa-user@test.com", "full_name": "QA Tester", "role": "owner", "org_name": "QA Org", ...}}` |
| Cookie | `mazou_session` set in `Set-Cookie` header |
| Password | Never returned in response body |

---

### TC-AUTH-02: Login — Happy Path

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email": "qa-user@test.com", "password": "TestPass123!"}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | `{"user": {...}}` with correct email |
| Cookie | `mazou_session` httpOnly cookie set |

**Save** the cookie value as `SESSION_COOKIE` for subsequent tests.

---

### TC-AUTH-03: Login — Wrong Password

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "qa-user@test.com", "password": "WrongPassword"}'
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |
| Body | `{"detail": "Invalid credentials"}` |
| Cookie | No `mazou_session` set |

---

### TC-AUTH-04: Get Current User

```bash
curl http://localhost:8000/api/auth/me \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | User object with `org_id`, `org_name`, `org_slug` |

**Save** `org_id` as `ORG_ID`.

---

### TC-AUTH-05: Get Current User — No Cookie

```bash
curl http://localhost:8000/api/auth/me
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |

---

### TC-AUTH-06: Signup — Duplicate Email

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "qa-user@test.com",
    "password": "TestPass123!",
    "full_name": "Duplicate",
    "org_name": "Dup Org"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `409 Conflict` |
| Body | Generic message (must NOT reveal "email already registered") |

---

### TC-AUTH-07: Signup — Weak Password

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@test.com",
    "password": "123",
    "full_name": "Weak",
    "org_name": "Weak Org"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `422 Unprocessable Entity` |
| Body | Validation error about password length (min 8 chars) |

---

### TC-AUTH-08: Logout

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | `{"ok": true}` |
| Cookie | `mazou_session` cleared (max-age=0 or deleted) |

After logout, calling `/api/auth/me` with the same cookie should return `401`.

---

## 3. TC-KEYS: API Key Management

> **Prerequisite:** Log in first and use the session cookie.

### TC-KEYS-01: Create Live Key

```bash
curl -X POST http://localhost:8000/v1/keys \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"name": "QA Live Key", "environment": "live"}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `key` | Starts with `mz_live_` |
| `key_prefix` | First 12 chars of the key |
| `environment` | `"live"` |
| `status` | `"active"` |

**Save** `key` as `LIVE_API_KEY` and `id` as `KEY_ID`. The full key is only shown once.

---

### TC-KEYS-02: Create Test Key

```bash
curl -X POST http://localhost:8000/v1/keys \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"name": "QA Test Key", "environment": "test"}'
```

| Check | Expected |
|-------|----------|
| `key` | Starts with `mz_test_` |
| `environment` | `"test"` |

**Save** as `TEST_API_KEY`.

---

### TC-KEYS-03: List Keys

```bash
curl http://localhost:8000/v1/keys \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Array containing both keys created above |
| Full key | NOT present in list response (only `key_prefix`) |

---

### TC-KEYS-04: Revoke Key

```bash
curl -X DELETE http://localhost:8000/v1/keys/KEY_ID \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | `{"ok": true, ...}` |

Verify: using the revoked key in an API call should return `401`.

---

### TC-KEYS-05: Create Key — No Auth

```bash
curl -X POST http://localhost:8000/v1/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "No Auth Key"}'
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |

---

### TC-KEYS-06: Create Key — Invalid Environment

```bash
curl -X POST http://localhost:8000/v1/keys \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"name": "Bad Env", "environment": "staging"}'
```

| Check | Expected |
|-------|----------|
| Status | `422 Unprocessable Entity` |

---

## 4. TC-WALLET: Wallet & Billing

### TC-WALLET-01: Get Wallet Balance

```bash
curl http://localhost:8000/v1/wallet \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `currency` | `"NGN"` |
| `balance_kobo` | Integer >= 0 |
| `balance_naira` | `balance_kobo / 100` |

---

### TC-WALLET-02: Get Transactions — Empty

```bash
curl "http://localhost:8000/v1/wallet/transactions?limit=10" \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Empty array `[]` (no transactions yet) |

---

### TC-WALLET-03: Initialize Topup

```bash
curl -X POST http://localhost:8000/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"amount_naira": 5000}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `authorization_url` | Paystack payment URL |
| `reference` | Non-empty string |
| `amount_naira` | `5000` |

> Note: You won't complete the payment in test. The webhook handles the credit.

---

### TC-WALLET-04: Topup — Invalid Amount

```bash
curl -X POST http://localhost:8000/v1/wallet/topup \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"amount_naira": -100}'
```

| Check | Expected |
|-------|----------|
| Status | `422 Unprocessable Entity` |

---

### TC-WALLET-05: Wallet — No Auth

```bash
curl http://localhost:8000/v1/wallet
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |

---

### TC-WALLET-06: Get Transactions After Activity

Run this test **after** making some API calls or receiving an admin wallet credit.

```bash
curl "http://localhost:8000/v1/wallet/transactions?limit=5" \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Array of `{type, amount_kobo, description, created_at, ...}` |
| `type` | Each is `"credit"` or `"debit"` |
| `balance_after_naira` | Matches running balance |

---

## 5. TC-GATEWAY: Chat Completions Gateway

> **Prerequisite:** You need a valid `LIVE_API_KEY` (create a new one if you revoked the previous one). Your wallet must have balance, or use a `TEST_API_KEY` to skip billing.

### TC-GATEWAY-01: Basic Completion (Test Key — No Billing)

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `choices` | Array with at least 1 choice |
| `choices[0].message.content` | Non-empty string |
| `x_mazou.request_id` | Starts with `mazou-` |
| `x_mazou.model` | The model used |
| `x_mazou.provider` | Provider name |
| `x_mazou.cost_kobo` | Integer >= 0 |
| Wallet | NOT debited (test key) |

---

### TC-GATEWAY-02: Streaming Completion

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Count to 5"}],
    "stream": true,
    "max_tokens": 100
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Content-Type | `text/event-stream` |
| Body | Multiple `data: {...}` lines |
| Last line | `data: [DONE]` |
| Headers | `X-Mazou-Request-Id`, `X-Mazou-Model`, `X-Mazou-Provider` present |

---

### TC-GATEWAY-03: Live Key — Insufficient Balance

Ensure wallet balance is 0 (or use a fresh account).

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LIVE_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

| Check | Expected |
|-------|----------|
| Status | `402 Payment Required` |
| Body | `{"detail": "Insufficient wallet balance..."}` |

---

### TC-GATEWAY-04: No Authorization Header

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}'
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |
| Body | Contains "Invalid API key format" |

---

### TC-GATEWAY-05: Invalid API Key

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer mz_live_invalid_key_12345" \
  -d '{"model": "gpt-4o-mini", "messages": [{"role": "user", "content": "Hello"}]}'
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |
| Body | "Invalid or revoked API key" |

---

### TC-GATEWAY-06: Empty Messages Array

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_API_KEY" \
  -d '{"model": "gpt-4o-mini", "messages": []}'
```

| Check | Expected |
|-------|----------|
| Status | `422 Unprocessable Entity` |

---

### TC-GATEWAY-07: With Mazou Extensions

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 50,
    "tag": "qa-test",
    "budget": "low"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `x_mazou` | Present with routing info |

Later verify: `GET /v1/usage?tag=qa-test` shows this call.

---

### TC-GATEWAY-08: Temperature and Top-P

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}],
    "temperature": 0.0,
    "top_p": 0.9,
    "max_tokens": 20
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Response | Deterministic output (temperature=0) |

---

### TC-GATEWAY-09: Smart Routing (budget=low)

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TEST_API_KEY" \
  -d '{
    "model": "gpt-5",
    "messages": [{"role": "user", "content": "What is 2+2?"}],
    "budget": "low",
    "max_tokens": 50
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `x_mazou.routed` | `true` (should route to cheaper model) |
| `x_mazou.routing_reason` | Non-null explanation |
| `x_mazou.model` | Likely a cheaper model than gpt-5 |

---

### TC-GATEWAY-10: Live Key With Balance — Wallet Debit

Fund the wallet first (via admin credit — see TC-ADMIN-07), then:

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer LIVE_API_KEY" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hi"}],
    "max_tokens": 10
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Wallet balance | Decreased by `x_mazou.cost_kobo` |
| Transaction | New debit entry in `/v1/wallet/transactions` |

---

## 6. TC-MODELS: Model Catalog

### TC-MODELS-01: List All Models

```bash
curl http://localhost:8000/v1/models
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `data` | Array of 40+ model objects |
| `count` | Matches array length |
| Each model | Has `id`, `name`, `provider`, `category`, `context_window` |

---

### TC-MODELS-02: Filter by Provider

```bash
curl "http://localhost:8000/v1/models?provider=anthropic"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| All models | Have `provider: "anthropic"` |

---

### TC-MODELS-03: Filter African Models

```bash
curl "http://localhost:8000/v1/models?is_african=true"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| All models | Have `is_african: true` |

---

### TC-MODELS-04: Get Single Model

```bash
curl http://localhost:8000/v1/models/gpt-4o-mini
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `id` | `"gpt-4o-mini"` |
| `provider` | `"openai"` |

---

## 7. TC-USAGE: Usage Analytics

> **Prerequisite:** Make a few API calls first (TC-GATEWAY-01/02) so there's data.

### TC-USAGE-01: Get Usage Logs (API Key Auth)

```bash
curl "http://localhost:8000/v1/usage?days=30&limit=10" \
  -H "Authorization: Bearer TEST_API_KEY"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `data` | Array of usage log objects |
| Each log | Has `model`, `provider`, `input_tokens`, `output_tokens`, `cost_kobo`, `latency_ms` |
| `period_days` | `30` |

---

### TC-USAGE-02: Usage Summary

```bash
curl "http://localhost:8000/v1/usage/summary?days=30" \
  -H "Authorization: Bearer TEST_API_KEY"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `total_calls` | >= 1 |
| `total_cost_kobo` | Integer |
| `by_model` | Breakdown per model |

---

### TC-USAGE-03: Filter by Tag

```bash
curl "http://localhost:8000/v1/usage?tag=qa-test" \
  -H "Authorization: Bearer TEST_API_KEY"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| All entries | Have `feature_tag: "qa-test"` |

---

### TC-USAGE-04: Usage — No Auth

```bash
curl http://localhost:8000/v1/usage
```

| Check | Expected |
|-------|----------|
| Status | `401 Unauthorized` |

---

## 8. TC-DASH: Dashboard

> **Prerequisite:** Logged in with session cookie.

### TC-DASH-01: Dashboard Stats

```bash
curl "http://localhost:8000/api/dashboard/stats?days=30" \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Fields | `total_spend_naira`, `total_calls`, `active_models`, `savings_naira` |
| `features` | Array (may be empty) |
| `models` | Array of model usage breakdown |

---

### TC-DASH-02: Usage Timeseries

```bash
curl "http://localhost:8000/api/dashboard/stats/usage?days=7&group_by=day" \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `data` | Array of time-bucketed entries |
| `group_by` | `"day"` |

---

### TC-DASH-03: Recommendations

```bash
curl http://localhost:8000/api/dashboard/recommendations \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Array of recommendation objects |

---

### TC-DASH-04: Agents List

```bash
curl http://localhost:8000/api/dashboard/agents \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Array (may be empty) |

---

### TC-DASH-05: Dashboard Wallet

```bash
curl http://localhost:8000/api/dashboard/wallet \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `balance_naira` | Float |
| `currency` | `"NGN"` |

---

## 9. TC-ROUTING: Routing Rules

### TC-ROUTING-01: List Rules — Empty

```bash
curl http://localhost:8000/api/routing/rules \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Empty array `[]` |

---

### TC-ROUTING-02: Create Rule

```bash
curl -X POST http://localhost:8000/api/routing/rules \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{
    "name": "Budget Saver",
    "description": "Route simple queries to cheaper models",
    "condition": "{\"budget\": \"low\"}",
    "action": "{\"model\": \"gpt-4o-mini\"}",
    "priority": 10,
    "status": "active"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `name` | `"Budget Saver"` |
| `status` | `"active"` |

**Save** `id` as `RULE_ID`.

---

### TC-ROUTING-03: Update Rule

```bash
curl -X PUT http://localhost:8000/api/routing/rules/RULE_ID \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"status": "paused"}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `status` | `"paused"` |

---

### TC-ROUTING-04: Update Rule — Invalid Status

```bash
curl -X PUT http://localhost:8000/api/routing/rules/RULE_ID \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{"status": "broken"}'
```

| Check | Expected |
|-------|----------|
| Status | `422 Unprocessable Entity` |

---

### TC-ROUTING-05: Delete Rule

```bash
curl -X DELETE http://localhost:8000/api/routing/rules/RULE_ID \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | `{"ok": true, ...}` |

Verify: list rules again — should be empty.

---

## 10. TC-BYOK: Bring Your Own Keys

### TC-BYOK-01: Store a Provider Key

```bash
curl -X POST http://localhost:8000/v1/byok \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{
    "provider": "openai",
    "label": "My OpenAI Key",
    "api_key": "sk-test-your-openai-key-here"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `provider` | `"openai"` |
| `label` | `"My OpenAI Key"` |
| `status` | `"connected"` |
| `api_key` | NOT present in response |

**Save** `id` as `BYOK_KEY_ID`.

---

### TC-BYOK-02: List BYOK Keys

```bash
curl http://localhost:8000/v1/byok \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Array with the key created above |
| `api_key` | NOT present (encrypted key never exposed) |

---

### TC-BYOK-03: Test BYOK Key (Invalid Key)

```bash
curl -X POST http://localhost:8000/v1/byok/BYOK_KEY_ID/test \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `valid` | `false` (since we stored a fake key) |
| `error` | Non-null error message |

---

### TC-BYOK-04: Test BYOK Key (Valid Key)

> Only run if you have a real provider key. Replace with an actual OpenAI key.

```bash
curl -X POST http://localhost:8000/v1/byok \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{
    "provider": "openai",
    "label": "Real OpenAI Key",
    "api_key": "sk-REAL-KEY-HERE"
  }'
```

Then test it:

```bash
curl -X POST http://localhost:8000/v1/byok/{new_id}/test \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| `valid` | `true` |

---

### TC-BYOK-05: Delete BYOK Key

```bash
curl -X DELETE http://localhost:8000/v1/byok/BYOK_KEY_ID \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `204 No Content` |

Verify: list BYOK keys — the deleted key should be gone.

---

### TC-BYOK-06: BYOK — Invalid Provider

```bash
curl -X POST http://localhost:8000/v1/byok \
  -H "Content-Type: application/json" \
  -b "mazou_session=SESSION_COOKIE" \
  -d '{
    "provider": "invalid_provider",
    "label": "Bad Provider",
    "api_key": "sk-test"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `422` or `400` |

---

## 11. TC-ADMIN: Admin Portal

> **Prerequisite:** Log in as the superadmin account (`demo@mazou.io`).

### TC-ADMIN-01: Login as Superadmin

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -c admin_cookies.txt \
  -d '{"email": "demo@mazou.io", "password": "YOUR_ADMIN_PASSWORD"}'
```

**Save** the cookie as `ADMIN_COOKIE`.

---

### TC-ADMIN-02: Platform Stats

```bash
curl http://localhost:8000/api/admin/stats \
  -b "mazou_session=ADMIN_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Fields | `total_orgs`, `total_users`, `total_api_keys`, `total_gmv_kobo`, `net_revenue_kobo`, `requests_today`, `requests_week`, `requests_month` |
| Values | All integers >= 0 |

---

### TC-ADMIN-03: List All Orgs

```bash
curl "http://localhost:8000/api/admin/orgs?limit=10" \
  -b "mazou_session=ADMIN_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `orgs` | Array of org objects |
| `total` | Total org count |
| Each org | Has `name`, `plan`, `status`, `wallet_balance_kobo` |

---

### TC-ADMIN-04: Get Org Detail

```bash
curl http://localhost:8000/api/admin/orgs/ORG_ID \
  -b "mazou_session=ADMIN_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Fields | `profiles`, `api_keys`, `wallets`, `recent_usage` |

---

### TC-ADMIN-05: Suspend Org

```bash
curl -X PUT http://localhost:8000/api/admin/orgs/ORG_ID/status \
  -H "Content-Type: application/json" \
  -b "mazou_session=ADMIN_COOKIE" \
  -d '{"status": "suspended"}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `status` | `"suspended"` |

> After suspending, verify the org's API calls are blocked (if implemented), then re-activate:

```bash
curl -X PUT http://localhost:8000/api/admin/orgs/ORG_ID/status \
  -H "Content-Type: application/json" \
  -b "mazou_session=ADMIN_COOKIE" \
  -d '{"status": "active"}'
```

---

### TC-ADMIN-06: Change Org Plan

```bash
curl -X PUT http://localhost:8000/api/admin/orgs/ORG_ID/plan \
  -H "Content-Type: application/json" \
  -b "mazou_session=ADMIN_COOKIE" \
  -d '{"plan": "growth"}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `plan` | `"growth"` |

---

### TC-ADMIN-07: Manual Wallet Credit

```bash
curl -X POST http://localhost:8000/api/admin/orgs/ORG_ID/wallet/credit \
  -H "Content-Type: application/json" \
  -b "mazou_session=ADMIN_COOKIE" \
  -d '{"amount_kobo": 500000, "description": "QA test credit"}'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `amount_kobo` | `500000` |
| `balance_after_kobo` | Previous balance + 500000 |

Verify: log in as the user and check `/v1/wallet` — balance should reflect the credit.

---

### TC-ADMIN-08: Platform Config

```bash
# Read config
curl http://localhost:8000/api/admin/config \
  -b "mazou_session=ADMIN_COOKIE"

# Update config
curl -X PUT http://localhost:8000/api/admin/config \
  -H "Content-Type: application/json" \
  -b "mazou_session=ADMIN_COOKIE" \
  -d '{"fx_rate_ngn_usd": 1600, "managed_margin": 0.20}'
```

| Check | Expected |
|-------|----------|
| GET Status | `200 OK` with `fx_rate_ngn_usd` and `managed_margin` |
| PUT Status | `200 OK` with updated values |

> Remember to reset to original values after testing.

---

### TC-ADMIN-09: Admin — Non-Admin Access Denied

Log in as the regular QA user and try to access admin endpoints:

```bash
curl http://localhost:8000/api/admin/stats \
  -b "mazou_session=SESSION_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `403 Forbidden` |
| Body | "Superadmin access required" or similar |

---

### TC-ADMIN-10: Platform Usage & Top Orgs

```bash
curl "http://localhost:8000/api/admin/usage?days=30&group_by=provider" \
  -b "mazou_session=ADMIN_COOKIE"

curl "http://localhost:8000/api/admin/usage/top-orgs?days=30" \
  -b "mazou_session=ADMIN_COOKIE"
```

| Check | Expected |
|-------|----------|
| `/usage` Status | `200 OK` with `total_requests`, `total_cost_kobo`, `breakdown[]` |
| `/usage/top-orgs` Status | `200 OK` with array of `{org_id, org_name, total_spend_kobo, total_calls}` |

---

## 12. TC-WEBHOOK: Paystack Webhooks

> These tests simulate Paystack webhook calls. Use a test Paystack secret key or disable signature verification for QA.

### TC-WEBHOOK-01: Valid Charge Success

```bash
# Compute signature: echo -n 'BODY' | openssl dgst -sha512 -hmac "PAYSTACK_SECRET_KEY"
curl -X POST http://localhost:8000/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: COMPUTED_HMAC" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "qa-test-ref-001",
      "amount": 500000,
      "currency": "NGN",
      "metadata": {"org_id": "ORG_ID"}
    }
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| `amount_kobo` | `500000` |
| Wallet | Credited with 500000 kobo (5000 Naira) |

---

### TC-WEBHOOK-02: Duplicate Webhook (Idempotency)

Send the exact same webhook again with the same `reference`:

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Wallet | Balance does NOT increase again |

---

### TC-WEBHOOK-03: Invalid Signature

```bash
curl -X POST http://localhost:8000/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: invalid_signature_here" \
  -d '{"event": "charge.success", "data": {"reference": "fake"}}'
```

| Check | Expected |
|-------|----------|
| Status | `400 Bad Request` or `401 Unauthorized` |

---

## 13. TC-SEC: Security & Edge Cases

### TC-SEC-01: Cross-Org Data Isolation

1. Sign up as `qa-user2@test.com` (creates a new org)
2. Log in and try accessing the first user's keys:

```bash
curl http://localhost:8000/v1/keys \
  -b "mazou_session=USER2_COOKIE"
```

| Check | Expected |
|-------|----------|
| Body | Should NOT contain keys from QA Org |

3. Try deleting a key owned by the first org:

```bash
curl -X DELETE http://localhost:8000/v1/keys/KEY_ID_FROM_ORG1 \
  -b "mazou_session=USER2_COOKIE"
```

| Check | Expected |
|-------|----------|
| Status | `404 Not Found` or `403 Forbidden` |

---

### TC-SEC-02: SQL Injection Attempt

```bash
curl "http://localhost:8000/v1/models?provider=openai'+OR+1=1--"
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | Empty array or only OpenAI models — no data leak |

---

### TC-SEC-03: XSS in Input Fields

```bash
curl -X POST http://localhost:8000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "xss@test.com",
    "password": "TestPass123!",
    "full_name": "<script>alert(1)</script>",
    "org_name": "<img onerror=alert(1)>"
  }'
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` (accepts as plain text) |
| Body | Values stored as-is, no script execution in API response |

---

### TC-SEC-04: Rate Limiting

Send 600+ requests within 1 minute using the same API key:

```bash
for i in $(seq 1 610); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    -X POST http://localhost:8000/v1/chat/completions \
    -H "Authorization: Bearer TEST_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"model":"gpt-4o-mini","messages":[{"role":"user","content":"hi"}]}' &
done
wait
```

| Check | Expected |
|-------|----------|
| First ~600 | `200 OK` |
| After 600 | `429 Too Many Requests` |
| Headers | `X-RateLimit-Limit`, `Retry-After` present on 429 |

---

### TC-SEC-05: Health Check

```bash
curl http://localhost:8000/health
```

| Check | Expected |
|-------|----------|
| Status | `200 OK` |
| Body | `{"status": "ok", "service": "mazou-gateway"}` |

---

## Appendix: Environment Variables

The backend requires these in `.env` at the project root:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT + encryption key (change from default!) |
| `DATABASE_URL` | Yes | `sqlite+aiosqlite:///./mazou.db` or PostgreSQL |
| `OPENAI_API_KEY` | Yes* | For OpenAI models |
| `ANTHROPIC_API_KEY` | Yes* | For Claude models |
| `GOOGLE_API_KEY` | No | For Gemini models |
| `DEEPSEEK_API_KEY` | No | For DeepSeek models |
| `MISTRAL_API_KEY` | No | For Mistral models |
| `PAYSTACK_SECRET_KEY` | Yes | For wallet topup + webhooks |
| `FX_RATE_NGN_USD` | No | Default: 1580 |
| `MANAGED_MARGIN` | No | Default: 0.15 (15%) |

*At least one LLM provider key is required for gateway tests.

---

## Test Execution Order

For the cleanest run, execute test cases in this order:

1. **TC-SEC-05** (health check — verify server is running)
2. **TC-MODELS** (public, no auth needed)
3. **TC-AUTH** (create accounts, get cookies)
4. **TC-KEYS** (create API keys for later tests)
5. **TC-WALLET** (check balance)
6. **TC-ADMIN-07** (credit wallet so live key tests work)
7. **TC-GATEWAY** (use keys + wallet)
8. **TC-USAGE** (verify calls were logged)
9. **TC-DASH** (verify dashboard reflects activity)
10. **TC-ROUTING** (CRUD routing rules)
11. **TC-BYOK** (store and test provider keys)
12. **TC-ADMIN** (full admin portal)
13. **TC-WEBHOOK** (payment flow)
14. **TC-SEC** (security edge cases)

---

## Test Result Template

| Test Case | Status | Notes |
|-----------|--------|-------|
| TC-AUTH-01 | PASS / FAIL | |
| TC-AUTH-02 | PASS / FAIL | |
| ... | | |

**Tester Name:** _______________
**Date:** _______________
**Backend Version:** _______________
**Environment:** Dev / Staging / Production
