/**
 * Demo mode: fake auth + mock data for local dev without Supabase.
 * Activated when VITE_SUPABASE_URL is not set.
 */

export const IS_DEMO_MODE = !import.meta.env.VITE_SUPABASE_URL;

/** True when demo auth is active (either via IS_DEMO_MODE or fallback) */
export function isDemoActive() { return _demoLoggedIn; }

let _demoLoggedIn = false;
const listeners = new Set<(loggedIn: boolean) => void>();

export const demoAuth = {
  get isLoggedIn() { return _demoLoggedIn; },

  login() {
    _demoLoggedIn = true;
    listeners.forEach(fn => fn(true));
  },

  logout() {
    _demoLoggedIn = false;
    listeners.forEach(fn => fn(false));
  },

  onAuthChange(fn: (loggedIn: boolean) => void) {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  },
};

// --- Mock data matching the real Supabase schema ---

export const MOCK_DASHBOARD_STATS = {
  total_spend_kobo: 54064300,
  spend_change_pct: -12.3,
  total_calls: 12847,
  active_models: 8,
  savings_kobo: 8942000,
  models: [
    { model: "gpt-4o", provider: "OpenAI", cost_kobo: 15630000, calls: 3200 },
    { model: "claude-sonnet-4-6", provider: "Anthropic", cost_kobo: 9850000, calls: 2800 },
    { model: "gemini-2.5-flash", provider: "Google", cost_kobo: 4520000, calls: 2100 },
    { model: "gpt-4o-mini", provider: "OpenAI", cost_kobo: 2830000, calls: 2220 },
    { model: "deepseek-r1", provider: "DeepSeek", cost_kobo: 2218000, calls: 1200 },
    { model: "llama-4-maverick", provider: "Meta", cost_kobo: 2000000, calls: 917 },
  ],
  features: [
    { tag: "Chatbot", calls: 6400, cost_kobo: 18000000 },
    { tag: "Code Assistant", calls: 3200, cost_kobo: 9600000 },
    { tag: "Summarization", calls: 2100, cost_kobo: 4500000 },
    { tag: "Translation", calls: 1147, cost_kobo: 2118000 },
  ],
  recent_routes: [
    { request_id: "req_a3f8b2c1", routed_from: "gpt-4o", routed_to: "gemini-2.5-flash", reason: "Cheaper for summarization.", savings_kobo: 4200, created_at: new Date(Date.now() - 120000).toISOString() },
    { request_id: "req_d7e1f4a9", routed_from: "claude-sonnet-4-6", routed_to: "deepseek-r1", reason: "Cost-optimized for code review.", savings_kobo: 3100, created_at: new Date(Date.now() - 360000).toISOString() },
    { request_id: "req_b5c2e8d3", routed_from: "gpt-4o", routed_to: "gpt-4o", reason: "Already optimal.", savings_kobo: 0, created_at: new Date(Date.now() - 600000).toISOString() },
    { request_id: "req_f9a1c3b7", routed_from: "gpt-4o", routed_to: "gpt-4o-mini", reason: "Mini sufficient for this task.", savings_kobo: 8500, created_at: new Date(Date.now() - 900000).toISOString() },
  ],
};

export const MOCK_USAGE_TIMESERIES = {
  data: Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d.toISOString().slice(0, 10),
      requests: 600 + Math.floor(Math.random() * 400),
      cost_kobo: (1500 + Math.floor(Math.random() * 2000)) * 100,
    };
  }),
};

export const MOCK_RECOMMENDATIONS = [
  { id: "r1", type: "save", title: "Switch summarization to Gemini Flash", description: "Your summarization tasks use GPT-4o but Gemini 2.5 Flash scores within 2% on ROUGE at 60% lower cost.", savings_kobo: 2844000, status: "pending", icon: "DollarSign" },
  { id: "r2", type: "cache", title: "Enable caching for repeated prompts", description: "12% of your requests have identical prompts. Enabling prompt caching could cut latency by 40%.", savings_kobo: 1580000, status: "pending", icon: "Timer" },
  { id: "r3", type: "swap", title: "Use DeepSeek R1 for code reviews", description: "DeepSeek R1 matches Claude Sonnet on code review benchmarks at 70% lower cost.", savings_kobo: 1896000, status: "applied", icon: "Package" },
];

export const MOCK_AGENTS = [
  { id: "a1", name: "Customer Support Bot", model: "gpt-4o", requests_30d: 4200, cost_30d_usd: 126.00, status: "active" },
  { id: "a2", name: "Code Review Agent", model: "claude-sonnet-4-6", requests_30d: 2800, cost_30d_usd: 84.00, status: "active" },
  { id: "a3", name: "Document Summarizer", model: "gemini-2.5-flash", requests_30d: 2100, cost_30d_usd: 45.20, status: "active" },
];

export const MOCK_WALLET = {
  balance_ngn: 85000,
  balance_usd: 53.80,
  currency: "NGN",
};

export const MOCK_WALLET_TRANSACTIONS = [
  { id: "t1", type: "credit", amount_ngn: 50000, description: "Wallet top-up via Paystack", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "t2", type: "debit", amount_ngn: -8500, description: "API usage — Jan 2026", created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
  { id: "t3", type: "credit", amount_ngn: 100000, description: "Wallet top-up via Paystack", created_at: new Date(Date.now() - 86400000 * 15).toISOString() },
];

export const MOCK_INVOICES = [
  { id: "inv1", period: "March 2026", amount_ngn: 85400, status: "paid", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "inv2", period: "February 2026", amount_ngn: 72100, status: "paid", created_at: new Date(Date.now() - 86400000 * 33).toISOString() },
];

export const MOCK_KEYS = [
  { id: "k1", name: "Production", key_prefix: "mz_live_a3f8", environment: "live", created_at: new Date(Date.now() - 86400000 * 30).toISOString(), last_used_at: new Date(Date.now() - 3600000).toISOString() },
  { id: "k2", name: "Development", key_prefix: "mz_test_9d2c", environment: "test", created_at: new Date(Date.now() - 86400000 * 10).toISOString(), last_used_at: new Date(Date.now() - 86400000).toISOString() },
];

export const MOCK_MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", category: "chat", is_african: false, input_price_per_1k: 0.0025, output_price_per_1k: 0.01 },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", category: "chat", is_african: false, input_price_per_1k: 0.00015, output_price_per_1k: 0.0006 },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", provider: "Anthropic", category: "chat", is_african: false, input_price_per_1k: 0.003, output_price_per_1k: 0.015 },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "Anthropic", category: "chat", is_african: false, input_price_per_1k: 0.0008, output_price_per_1k: 0.004 },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google", category: "chat", is_african: false, input_price_per_1k: 0.00015, output_price_per_1k: 0.0006 },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google", category: "chat", is_african: false, input_price_per_1k: 0.00125, output_price_per_1k: 0.005 },
  { id: "deepseek-r1", name: "DeepSeek R1", provider: "DeepSeek", category: "reasoning", is_african: false, input_price_per_1k: 0.00055, output_price_per_1k: 0.0022 },
  { id: "llama-4-maverick", name: "Llama 4 Maverick", provider: "Meta", category: "chat", is_african: false, input_price_per_1k: 0.0002, output_price_per_1k: 0.0008 },
  { id: "inkubalm", name: "InkubaLM", provider: "Lelapa AI", category: "chat", is_african: true, input_price_per_1k: 0.0001, output_price_per_1k: 0.0004 },
  { id: "vulavula", name: "Vulavula", provider: "Lelapa AI", category: "nlu", is_african: true, input_price_per_1k: 0.00008, output_price_per_1k: 0.0003 },
];

export const MOCK_ROUTING_RULES = [
  { id: "rr1", name: "Cost optimizer", description: "Route summarization to cheapest model", trigger: "task=summarization", target_model: "gemini-2.5-flash", enabled: true },
  { id: "rr2", name: "Fallback chain", description: "If primary fails, fall back to GPT-4o", trigger: "on_error", target_model: "gpt-4o", enabled: true },
];

export const MOCK_USER = {
  id: "demo-user",
  email: "demo@mazou.io",
  name: "Demo User",
  org: "Mazou Demo",
  role: "admin",
};
