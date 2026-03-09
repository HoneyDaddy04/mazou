/**
 * API client utilities for connecting frontend to FastAPI backend.
 * Uses TanStack Query for data fetching with caching and revalidation.
 * Auth tokens are injected from Supabase session automatically.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

// API base URL: uses VITE_API_URL in production, empty in dev (Vite proxy handles it)
const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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

// Dashboard API
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
    apiRequest("/api/routing/rules", { body: data }),
  updateRule: (id: string, data: unknown) =>
    apiRequest(`/api/routing/rules/${id}`, { method: "PUT", body: data }),
  deleteRule: (id: string) =>
    apiRequest(`/api/routing/rules/${id}`, { method: "DELETE" }),
};

// Keys API
export const keysApi = {
  list: "/v1/keys",
  create: (data: { name: string; environment?: string }) =>
    apiRequest("/v1/keys", { body: data }),
  revoke: (id: string) =>
    apiRequest(`/v1/keys/${id}`, { method: "DELETE" }),
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

export function useDashboardStats(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "stats", days],
    queryFn: () => fetcher(dashboardApi.stats(days)),
  });
}

export function useDashboardUsage(days = 30, groupBy = "day") {
  return useQuery({
    queryKey: ["dashboard", "usage", days, groupBy],
    queryFn: () => fetcher(dashboardApi.usage(days, groupBy)),
  });
}

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: () => fetcher(dashboardApi.recommendations),
  });
}

export function useAgents() {
  return useQuery({
    queryKey: ["agents"],
    queryFn: () => fetcher(dashboardApi.agents),
  });
}

export function useWallet() {
  return useQuery({
    queryKey: ["wallet"],
    queryFn: () => fetcher(dashboardApi.wallet),
  });
}

export function useWalletTransactions(limit = 20, offset = 0) {
  return useQuery({
    queryKey: ["wallet", "transactions", limit, offset],
    queryFn: () => fetcher(dashboardApi.walletTransactions(limit, offset)),
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: () => fetcher(dashboardApi.invoices),
  });
}

export function useDepartments(days = 30) {
  return useQuery({
    queryKey: ["dashboard", "departments", days],
    queryFn: () => fetcher(dashboardApi.departments(days)),
  });
}

export function useBundles() {
  return useQuery({
    queryKey: ["bundles"],
    queryFn: () => fetcher(dashboardApi.bundles),
  });
}

export function useBundlePackages() {
  return useQuery({
    queryKey: ["bundles", "packages"],
    queryFn: () => fetcher(dashboardApi.bundlePackages),
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["keys"],
    queryFn: () => fetcher(keysApi.list),
  });
}

export function useModels(params?: { is_african?: boolean; category?: string }) {
  return useQuery({
    queryKey: ["models", params],
    queryFn: () => fetcher(modelsApi.list(params)),
  });
}

export function useRoutingRules() {
  return useQuery({
    queryKey: ["routing", "rules"],
    queryFn: () => fetcher(routingApi.rules),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => fetcher("/api/auth/me"),
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
      apiRequest("/api/dashboard/bundles/purchase", {
        body: { package_id: packageId },
      }),
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
      apiRequest(`/api/dashboard/recommendations/${id}`, {
        method: "PATCH",
        body: { status },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
  });
}
