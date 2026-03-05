/**
 * API client utilities for connecting Next.js frontend to FastAPI backend.
 * Uses SWR for data fetching with automatic revalidation.
 */

// SWR fetcher — includes credentials for cookie-based auth
export const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
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

// POST/PUT/DELETE helper
export async function apiRequest<T = unknown>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: options.method || "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

// Auth helpers
export const authApi = {
  signup: (data: {
    email: string;
    password: string;
    full_name: string;
    org_name: string;
  }) => apiRequest("/api/auth/signup", { body: data }),

  login: (data: { email: string; password: string }) =>
    apiRequest("/api/auth/login", { body: data }),

  logout: () => apiRequest("/api/auth/logout"),

  me: () => fetcher("/api/auth/me"),
};

// Dashboard API
export const dashboardApi = {
  stats: (days = 30) => `/api/dashboard/stats?days=${days}`,
  usage: (days = 30, groupBy = "day") =>
    `/api/dashboard/stats/usage?days=${days}&group_by=${groupBy}`,
  recommendations: "/api/dashboard/recommendations",
  agents: "/api/dashboard/agents",
  wallet: "/api/dashboard/wallet",
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
