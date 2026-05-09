/**
 * AETERNA — API Client.
 * Fetch-обёртка для FastAPI бэкенда.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `API Error: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Tasks ────────────────────────────────────────────────────
export const tasksApi = {
  list: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch<any[]>(`/api/v1/tasks${query}`, { token });
  },
  create: (token: string, data: any) =>
    apiFetch<any>("/api/v1/tasks", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
  update: (token: string, id: string, data: any) =>
    apiFetch<any>(`/api/v1/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      token,
    }),
  delete: (token: string, id: string) =>
    apiFetch<void>(`/api/v1/tasks/${id}`, { method: "DELETE", token }),
};

// ── Calendar ─────────────────────────────────────────────────
export const calendarApi = {
  list: (token: string, params?: Record<string, string>) => {
    const query = params ? `?${new URLSearchParams(params)}` : "";
    return apiFetch<any[]>(`/api/v1/events${query}`, { token });
  },
  create: (token: string, data: any) =>
    apiFetch<any>("/api/v1/events", {
      method: "POST",
      body: JSON.stringify(data),
      token,
    }),
};

// ── Analytics ────────────────────────────────────────────────
export const analyticsApi = {
  productivityIndex: (token: string) =>
    apiFetch<any>("/api/v1/analytics/productivity-index", { token }),
  xpHistory: (token: string) =>
    apiFetch<any[]>("/api/v1/analytics/xp-history", { token }),
};
