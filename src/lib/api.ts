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
}

export interface DomainRecord {
  id: string;
  domain: string;
  upstream: string;
  createdAt: string;
  status: string;
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

export const coreShieldApi = {
  getStats: () => request<StatsResponse>("/stats"),
  listDomains: () => request<{ domains: DomainRecord[] }>("/domains"),
  addDomain: (domain: string, upstream?: string) =>
    request<{ domain: DomainRecord }>("/domains", {
      method: "POST",
      body: JSON.stringify({ domain, upstream }),
    }),
  blockIp: (ip: string, reason?: string) =>
    request("/security/block-ip", {
      method: "POST",
      body: JSON.stringify({ ip, reason }),
    }),
};

export { ApiError };
