/**
 * Thin client for the CoreShield backend API (the Express app built earlier).
 *
 * NEXT_PUBLIC_API_URL must point at your backend, e.g. http://localhost:4000/api/v1
 * NEXT_PUBLIC_* vars are exposed to the browser at build time, so never put
 * secrets here — the JWT itself should come from your auth flow / session,
 * not be hardcoded in the frontend.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export interface StatsResponse {
  generatedAt: string;
  activeBlocks: number;
  traffic: {
    requestsLast24h: number | null;
    note?: string;
  };
  attacksBlockedLast24h: number;
  protectedDomains: number;
  avgResponseTimeMs: number | null;
  cacheRate: number | null;
}

export interface HistoryPoint {
  hour: string;
  requests: number;
  avgResponseTimeMs: number | null;
}

export interface DomainRecord {
  id: string;
  domain: string;
  upstream: string;
  createdAt: string;
  status: string;
}

export interface BlockedIpRecord {
  ip: string;
  reason: string | null;
  blockedAt: string | null;
  expiresAt?: string | null;
}

export interface PublicStatus {
  status: string;
  protectedDomains: number;
  attacksBlockedLast24h: number;
  activeIpBlocks: number;
  avgResponseTimeMs: number | null;
  generatedAt: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // In a real app, pull this from your auth/session layer (e.g. next-auth,
  // a cookie-based session, etc.) — never hardcode a token in source.
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("coreshield_token") : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error || `Request failed (${res.status})`, res.status);
  }

  return res.json();
}

export interface SystemInfo {
  username: string;
  env: string;
  blockMethod: string;
  corsOrigins: string[];
  jwtExpiresIn: string;
}

export const coreShieldApi = {
  login: (username: string, password: string) =>
    request<{ token: string; expiresIn: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>("/auth/password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getSystemInfo: () => request<SystemInfo>("/auth/system-info"),
  getStats: () => request<StatsResponse>("/stats"),
  getPublicStatus: () => request<PublicStatus>("/public/status"),
  getHistory: () => request<{ history: HistoryPoint[] }>("/stats/history"),
  listDomains: () => request<{ domains: DomainRecord[] }>("/domains"),
  addDomain: (domain: string, upstream?: string) =>
    request<{ domain: DomainRecord }>("/domains", {
      method: "POST",
      body: JSON.stringify({ domain, upstream }),
    }),
  removeDomain: (domain: string) =>
    request(`/domains/${encodeURIComponent(domain)}`, { method: "DELETE" }),
  listBlockedIps: () =>
    request<{ blocked: BlockedIpRecord[] }>("/security/block-ip"),
  blockIp: (ip: string, reason?: string) =>
    request("/security/block-ip", {
      method: "POST",
      body: JSON.stringify({ ip, reason }),
    }),
  unblockIp: (ip: string) =>
    request(`/security/block-ip/${encodeURIComponent(ip)}`, { method: "DELETE" }),
};

export { ApiError };
