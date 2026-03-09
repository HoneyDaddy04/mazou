/**
 * Direct Supabase queries for dashboard data.
 * Used when no backend API is deployed (e.g. Vercel static hosting).
 * RLS policies on all tables ensure org-level access control.
 */

import { supabase } from "./supabase";

// ── Helpers ──

async function getOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("supabase_uid", user.id)
    .limit(1)
    .single();
  return data?.org_id ?? null;
}

// Cache org_id for the session
let cachedOrgId: string | null = null;
async function orgId(): Promise<string> {
  if (!cachedOrgId) cachedOrgId = await getOrgId();
  if (!cachedOrgId) throw new Error("Not authenticated");
  return cachedOrgId;
}

// Clear cache on auth change
supabase.auth.onAuthStateChange(() => { cachedOrgId = null; });

// ── Dashboard Stats ──

export async function fetchDashboardStats(days = 30) {
  const org = await orgId();
  const since = new Date(Date.now() - days * 86400000).toISOString();
  const prevSince = new Date(Date.now() - days * 2 * 86400000).toISOString();

  const { data: rows } = await supabase
    .from("usage_logs")
    .select("model, provider, feature_tag, cost_kobo, savings_kobo, input_tokens, output_tokens, request_id, routed_from, routed_to, routing_reason, created_at")
    .eq("org_id", org)
    .eq("is_test", false)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  const logs = rows || [];
  const totalCostKobo = logs.reduce((s, r) => s + (r.cost_kobo || 0), 0);
  const totalCalls = logs.length;
  const activeModels = new Set(logs.map(r => r.model).filter(Boolean)).size;
  const totalSavingsKobo = logs.reduce((s, r) => s + (r.savings_kobo || 0), 0);

  // Previous period
  const { data: prevRows } = await supabase
    .from("usage_logs")
    .select("cost_kobo")
    .eq("org_id", org)
    .eq("is_test", false)
    .gte("created_at", prevSince)
    .lt("created_at", since)
    .limit(5000);

  const prevCost = (prevRows || []).reduce((s, r) => s + (r.cost_kobo || 0), 0);
  const spendChangePct = prevCost > 0
    ? Math.round(((totalCostKobo - prevCost) / prevCost) * 1000) / 10
    : null;

  // Feature breakdown
  const featureMap: Record<string, any> = {};
  for (const r of logs) {
    const tag = r.feature_tag || "untagged";
    if (!featureMap[tag]) featureMap[tag] = { tag, calls: 0, cost_kobo: 0, savings_kobo: 0 };
    featureMap[tag].calls++;
    featureMap[tag].cost_kobo += r.cost_kobo || 0;
    featureMap[tag].savings_kobo += r.savings_kobo || 0;
  }
  const features = Object.values(featureMap)
    .sort((a: any, b: any) => b.cost_kobo - a.cost_kobo)
    .map((f: any) => ({ ...f, cost_naira: Math.round(f.cost_kobo / 100 * 100) / 100 }));

  // Model breakdown
  const modelMap: Record<string, any> = {};
  for (const r of logs) {
    const key = r.model || "";
    if (!modelMap[key]) modelMap[key] = { model: key, provider: r.provider || "", calls: 0, cost_kobo: 0, input_tokens: 0, output_tokens: 0 };
    modelMap[key].calls++;
    modelMap[key].cost_kobo += r.cost_kobo || 0;
    modelMap[key].input_tokens += r.input_tokens || 0;
    modelMap[key].output_tokens += r.output_tokens || 0;
  }
  const models = Object.values(modelMap)
    .sort((a: any, b: any) => b.cost_kobo - a.cost_kobo)
    .map((m: any) => ({ ...m, cost_naira: Math.round(m.cost_kobo / 100 * 100) / 100 }));

  // Recent routing events
  const recentRoutes = logs
    .filter(r => r.routed_from)
    .slice(0, 10)
    .map(r => ({
      request_id: r.request_id || "",
      routed_from: r.routed_from,
      routed_to: r.routed_to || r.model || "",
      reason: r.routing_reason,
      savings_kobo: r.savings_kobo || 0,
      created_at: r.created_at || "",
    }));

  return {
    total_spend_naira: Math.round(totalCostKobo / 100 * 100) / 100,
    total_spend_kobo: totalCostKobo,
    total_calls: totalCalls,
    active_models: activeModels,
    savings_naira: Math.round(totalSavingsKobo / 100 * 100) / 100,
    savings_kobo: totalSavingsKobo,
    spend_change_pct: spendChangePct,
    features,
    models,
    recent_routes: recentRoutes,
  };
}

// ── Usage Timeseries ──

export async function fetchUsageTimeseries(days = 30, groupBy = "day") {
  const org = await orgId();
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: rows } = await supabase
    .from("usage_logs")
    .select("model, feature_tag, cost_kobo, input_tokens, output_tokens, created_at")
    .eq("org_id", org)
    .eq("is_test", false)
    .gte("created_at", since)
    .order("created_at")
    .limit(5000);

  const grouped: Record<string, any> = {};
  for (const r of (rows || [])) {
    const dateStr = (r.created_at || "").slice(0, 10);
    let key = dateStr;
    if (groupBy === "model") key = `${dateStr}|${r.model || ""}`;
    else if (groupBy === "tag") key = `${dateStr}|${r.feature_tag || ""}`;

    if (!grouped[key]) {
      const entry: any = { date: dateStr, calls: 0, cost_kobo: 0, input_tokens: 0, output_tokens: 0 };
      if (groupBy === "model") entry.model = r.model || "";
      else if (groupBy === "tag") entry.tag = r.feature_tag || "";
      grouped[key] = entry;
    }
    grouped[key].calls++;
    grouped[key].cost_kobo += r.cost_kobo || 0;
    grouped[key].input_tokens += r.input_tokens || 0;
    grouped[key].output_tokens += r.output_tokens || 0;
  }

  const data = Object.values(grouped).sort((a: any, b: any) => a.date.localeCompare(b.date));
  for (const entry of data) (entry as any).cost_naira = Math.round((entry as any).cost_kobo / 100 * 100) / 100;

  return { data, period_days: days, group_by: groupBy };
}

// ── Recommendations ──

export async function fetchRecommendations() {
  const org = await orgId();
  const { data } = await supabase
    .from("recommendations")
    .select("*")
    .eq("org_id", org)
    .order("savings_kobo", { ascending: false });

  return (data || []).map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    savings_naira: Math.round(r.savings_kobo / 100 * 100) / 100,
    savings_kobo: r.savings_kobo,
    impact: r.impact,
    status: r.status,
    created_at: r.created_at,
  }));
}

export async function updateRecommendation(id: string, status: string) {
  const org = await orgId();
  // Verify ownership
  const { data: existing } = await supabase
    .from("recommendations")
    .select("id")
    .eq("id", id)
    .eq("org_id", org)
    .single();
  if (!existing) throw new Error("Recommendation not found");

  await supabase.from("recommendations").update({ status }).eq("id", id);

  const { data: updated } = await supabase
    .from("recommendations")
    .select("*")
    .eq("id", id)
    .single();

  return updated ? {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    description: updated.description,
    savings_naira: Math.round(updated.savings_kobo / 100 * 100) / 100,
    savings_kobo: updated.savings_kobo,
    impact: updated.impact,
    status: updated.status,
    created_at: updated.created_at,
  } : null;
}

// ── Agents ──

export async function fetchAgents() {
  const org = await orgId();
  const { data } = await supabase
    .from("agents")
    .select("*")
    .eq("org_id", org)
    .order("created_at", { ascending: false });

  return (data || []).map(a => ({
    id: a.id,
    name: a.name,
    status: a.status,
    models: typeof a.models === "string" ? JSON.parse(a.models) : (a.models || []),
    config: typeof a.config === "string" ? JSON.parse(a.config) : (a.config || {}),
    created_at: a.created_at || "",
    updated_at: a.updated_at,
  }));
}

// ── Wallet ──

export async function fetchWallet() {
  const org = await orgId();
  const { data } = await supabase
    .from("wallets")
    .select("*")
    .eq("org_id", org)
    .eq("currency", "NGN")
    .limit(1)
    .single();

  if (!data) return { balance_naira: 0, balance_kobo: 0, currency: "NGN" };
  return {
    balance_naira: Math.round(data.balance_kobo / 100 * 100) / 100,
    balance_kobo: data.balance_kobo,
    currency: data.currency,
  };
}

export async function fetchWalletTransactions(limit = 20, offset = 0) {
  const org = await orgId();
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("org_id", org)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return (data || []).map(t => ({
    id: t.id,
    type: t.type,
    amount_kobo: t.amount_kobo,
    amount_naira: Math.round(t.amount_kobo / 100 * 100) / 100,
    balance_after_kobo: t.balance_after_kobo,
    balance_after_naira: Math.round(t.balance_after_kobo / 100 * 100) / 100,
    description: t.description,
    reference: t.reference,
    created_at: t.created_at || "",
  }));
}

// ── Invoices ──

export async function fetchInvoices() {
  const org = await orgId();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("org_id", org)
    .order("period_end", { ascending: false });

  return (data || []).map(inv => ({
    id: inv.id,
    period_start: inv.period_start || "",
    period_end: inv.period_end || "",
    total_cost_kobo: inv.total_cost_kobo,
    total_cost_naira: Math.round(inv.total_cost_kobo / 100 * 100) / 100,
    total_calls: inv.total_calls,
    currency: inv.currency || "NGN",
    status: inv.status || "paid",
    created_at: inv.created_at || "",
  }));
}

// ── Routing Rules ──

export async function fetchRoutingRules() {
  const org = await orgId();
  const { data } = await supabase
    .from("routing_rules")
    .select("*")
    .eq("org_id", org)
    .order("priority", { ascending: false });

  return (data || []).map(r => ({
    ...r,
    condition: typeof r.condition === "string" ? JSON.parse(r.condition) : r.condition,
    action: typeof r.action === "string" ? JSON.parse(r.action) : r.action,
  }));
}

export async function createRoutingRule(ruleData: any) {
  const org = await orgId();
  const { data, error } = await supabase
    .from("routing_rules")
    .insert({
      ...ruleData,
      org_id: org,
      condition: typeof ruleData.condition === "object" ? JSON.stringify(ruleData.condition) : ruleData.condition,
      action: typeof ruleData.action === "object" ? JSON.stringify(ruleData.action) : ruleData.action,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateRoutingRule(id: string, ruleData: any) {
  const org = await orgId();
  const updates: any = { ...ruleData };
  if (typeof updates.condition === "object") updates.condition = JSON.stringify(updates.condition);
  if (typeof updates.action === "object") updates.action = JSON.stringify(updates.action);
  delete updates.id;
  delete updates.org_id;

  const { data, error } = await supabase
    .from("routing_rules")
    .update(updates)
    .eq("id", id)
    .eq("org_id", org)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteRoutingRule(id: string) {
  const org = await orgId();
  const { error } = await supabase
    .from("routing_rules")
    .delete()
    .eq("id", id)
    .eq("org_id", org);
  if (error) throw new Error(error.message);
}

// ── API Keys ──

export async function fetchApiKeys() {
  const org = await orgId();
  const { data } = await supabase
    .from("api_keys")
    .select("*")
    .eq("org_id", org)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createApiKey(keyData: { name: string; environment?: string }) {
  const org = await orgId();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("supabase_uid", user.id)
    .single();

  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const env = keyData.environment || "live";
  const prefix = env === "test" ? "mz_test" : "mz_live";
  let rawKey = `${prefix}_`;
  for (let i = 0; i < 32; i++) rawKey += chars[Math.floor(Math.random() * chars.length)];

  // SHA-256 hash
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(rawKey));
  const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      org_id: org,
      name: keyData.name,
      key_prefix: rawKey.slice(0, 12),
      key_hash: keyHash,
      environment: env,
      created_by: profile?.id,
      total_calls: 0,
      status: "active",
      rate_limit_rpm: 600,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { ...data, raw_key: rawKey };
}

export async function revokeApiKey(id: string) {
  const org = await orgId();
  const { error } = await supabase
    .from("api_keys")
    .update({ status: "revoked" })
    .eq("id", id)
    .eq("org_id", org);
  if (error) throw new Error(error.message);
}

// ── Current User ──

export async function fetchCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, organizations(*)")
    .eq("supabase_uid", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");
  return profile;
}

// ── Models (static, from constants) ──

import { CATALOG_MODELS } from "./constants";

export function fetchModels(params?: { is_african?: boolean; category?: string }) {
  let models = CATALOG_MODELS;
  if (params?.is_african !== undefined) {
    models = models.filter(m => m.isAfrican === params.is_african);
  }
  if (params?.category && params.category !== "All") {
    models = models.filter(m => m.category === params.category);
  }
  return models.map(m => ({
    id: m.id,
    name: m.name,
    provider: m.provider,
    provider_icon: m.providerIcon,
    provider_color: m.providerColor,
    category: m.category,
    tags: m.tags,
    description: m.description,
    context_window: m.contextWindow,
    input_cost_per_1m: m.inputCost,
    output_cost_per_1m: m.outputCost,
    is_african: m.isAfrican,
    african_meta: m.africanMeta,
    released: m.released,
  }));
}
