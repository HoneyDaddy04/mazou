/**
 * API client utilities for connecting frontend to FastAPI backend.
 * When VITE_API_URL is set, uses the backend API.
 * When empty (Vercel static hosting), queries Supabase directly via RLS.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";
import * as sq from "./supabase-queries";
import { IS_DEMO_MODE, MOCK_DASHBOARD_STATS, MOCK_USAGE_TIMESERIES, MOCK_RECOMMENDATIONS, MOCK_AGENTS, MOCK_WALLET, MOCK_WALLET_TRANSACTIONS, MOCK_INVOICES, MOCK_KEYS, MOCK_MODELS, MOCK_ROUTING_RULES, MOCK_USER } from "./demo-auth";

// API base URL: uses VITE_API_URL in production, empty in dev (Vite proxy handles it)
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

// True when we have a backend API to call (dev with Vite proxy, or explicit VITE_API_URL)
const HAS_BACKEND = !!API_BASE || import.meta.env.DEV;

// Get Supabase auth token for API requests
async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    return { Authorization: `Bearer ${session.access_token}` };
  }
  return {};
}

// Fetcher - includes Supabase auth token
export const fetcher = async (url: string) => {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${url}`, {
    credentials: "include",
    headers: authHeaders,
  });
  if (!res.ok) {
    const error = new Error("API request failed") as Error & {
      status: number;
      info: unknown;
    };
    error.status = res.status;
    try {
      error.info = await res.json();
    } catch {
      error.info = await res.text();
    }
    throw error;
  }
  return res.json();
};

// POST/PUT/PATCH/DELETE helper
export async function apiRequest<T = unknown>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(`${API_BASE}${url}`, {
    method: options.method || "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(data.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

// Dashboard API (backend paths)
export const dashboardApi = {
  stats: (days = 30) => `/api/dashboard/stats?days=${days}`,
  usage: (days = 30, groupBy = "day") =>
    `/api/dashboard/stats/usage?days=${days}&group_by=${groupBy}`,
  recommendations: "/api/dashboard/recommendations",
  agents: "/api/dashboard/agents",
  wallet: "/api/dashboard/wallet",
  walletTransactions: (limit = 20, offset = 0) =>
    `/api/dashboard/wallet/transactions?limit=${limit}&offset=${offset}`,
  invoices: "/api/dashboard/invoices",
  departments: (days = 30) => `/api/dashboard/stats/departments?days=${days}`,
  bundles: "/api/dashboard/bundles",
  bundlePackages: "/api/dashboard/bundles/packages",
};

// Routing API
export const routingApi = {
  rules: "/api/routing/rules",
  createRule: (data: unknown) =>
    HAS_BACKEND
      ? apiRequest("/api/routing/rules", { body: data })
      : sq.createRoutingRule(data),
  updateRule: (id: string, data: unknown) =>
    HAS_BACKEND
      ? apiRequest(`/api/routing/rules/${id}`, { method: "PUT", body: data })
      : sq.updateRoutingRule(id, data),
  deleteRule: (id: string) =>
    HAS_BACKEND
      ? apiRequest(`/api/routing/rules/${id}`, { method: "DELETE" })
      : sq.deleteRoutingRule(id),
};

// Keys API
export const keysApi = {
  list: "/v1/keys",
  create: (data: { name: string; environment?: string }) =>
    HAS_BACKEND
      ? apiRequest("/v1/keys", { body: data })
      : sq.createApiKey(data),
  revoke: (id: string) =>
    HAS_BACKEND
      ? apiRequest(`/v1/keys/${id}`, { method: "DELETE" })
      : sq.revokeApiKey(id),
};

// Models API
export const modelsApi = {
  list: (params?: { is_african?: boolean; category?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.is_african !== undefined)
      searchParams.set("is_african", String(params.is_african));
    if (params?.category) searchParams.set("category", params.category);
    const qs = searchParams.toString();
    return `/v1/models${qs ? `?${qs}` : ""}`;
  },
  get: (id: string) => `/v1/models/${id}`,
};

// --- TanStack Query hooks ---
// Each hook uses Supabase-direct queries when no backend is available

export function useDashboardStats(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "stats", days],
    queryFn: () => IS_DEMO_MODE ? MOCK_DASHBOARD_STATS : HAS_BACKEND ? fetcher(dashboardApi.stats(days)) : sq.fetchDashboardStats(days),
  });
}

export function useDashboardUsage(days = 30, groupBy = "day") {
  return useQuery({
    queryKey: ["dashboard", "usage", days, groupBy],
    queryFn: () => IS_DEMO_MODE ? MOCK_USAGE_TIMESERIES : HAS_BACKEND ? fetcher(dashboardApi.usage(days, groupBy)) : sq.fetchUsageTimeseries(days, groupBy),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => IS_DEMO_MODE ? MOCK_RECOMMENDATIONS : HAS_BACKEND ? fetcher(dashboardApi.recommendations) : sq.fetchRecommendations(),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => IS_DEMO_MODE ? MOCK_AGENTS : HAS_BACKEND ? fetcher(dashboardApi.agents) : sq.fetchAgents(),
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => IS_DEMO_MODE ? MOCK_WALLET : HAS_BACKEND ? fetcher(dashboardApi.wallet) : sq.fetchWallet(),
  });
}

export function useWalletTransactions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["wallet", "transactions", limit, offset],
    queryFn: () => IS_DEMO_MODE ? MOCK_WALLET_TRANSACTIONS : HAS_BACKEND ? fetcher(dashboardApi.walletTransactions(limit, offset)) : sq.fetchWalletTransactions(limit, offset),
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => IS_DEMO_MODE ? MOCK_INVOICES : HAS_BACKEND ? fetcher(dashboardApi.invoices) : sq.fetchInvoices(),
  });
}

export function useDepartments(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "departments", days],
    queryFn: () => IS_DEMO_MODE ? MOCK_DASHBOARD_STATS.features : HAS_BACKEND ? fetcher(dashboardApi.departments(days)) : sq.fetchDashboardStats(days).then(s => s.features),
  });
}

export function useBundles() {
  return useQuery({
    queryKey: ["bundles"],
    queryFn: () => HAS_BACKEND ? fetcher(dashboardApi.bundles) : Promise.resolve([]),
  });
}

export function useBundlePackages() {
  return useQuery({
    queryKey: ["bundles", "packages"],
    queryFn: () => HAS_BACKEND ? fetcher(dashboardApi.bundlePackages) : Promise.resolve([]),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["keys"],
    queryFn: () => IS_DEMO_MODE ? MOCK_KEYS : HAS_BACKEND ? fetcher(keysApi.list) : sq.fetchApiKeys(),
  });
}

export function useModels(params?: { is_african?: boolean; category?: string }) {
  return useQuery({
    queryKey: ["models", params],
    queryFn: () => IS_DEMO_MODE ? MOCK_MODELS.filter(m => params?.is_african !== undefined ? m.is_african === params.is_african : true) : HAS_BACKEND ? fetcher(modelsApi.list(params)) : Promise.resolve(sq.fetchModels(params)),
  });
}

export function useRoutingRules() {
  return useQuery({
    queryKey: ["routing", "rules"],
    queryFn: () => IS_DEMO_MODE ? MOCK_ROUTING_RULES : HAS_BACKEND ? fetcher(routingApi.rules) : sq.fetchRoutingRules(),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => IS_DEMO_MODE ? MOCK_USER : HAS_BACKEND ? fetcher("/api/auth/me") : sq.fetchCurrentUser(),
    retry: false,
  });
}

// Mutation hooks

export function useCreateKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; environment?: string }) =>
      keysApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["keys"] }),
  });
}

export function useRevokeKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => keysApi.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["keys"] }),
  });
}

export function useCreateRoutingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => routingApi.createRule(data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["routing"] }),
  });
}

export function useUpdateRoutingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      routingApi.updateRule(id, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["routing"] }),
  });
}

export function useDeleteRoutingRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => routingApi.deleteRule(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["routing"] }),
  });
}

export function usePurchaseBundle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packageId: string) =>
      HAS_BACKEND
        ? apiRequest("/api/dashboard/bundles/purchase", { body: { package_id: packageId } })
        : Promise.reject(new Error("Bundle purchase requires backend API")),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      queryClient.invalidateQueries({ queryKey: ["wallet", "transactions"] });
    },
  });
}

export function useUpdateRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      HAS_BACKEND
        ? apiRequest(`/api/dashboard/recommendations/${id}`, { method: "PATCH", body: { status } })
        : sq.updateRecommendation(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}
