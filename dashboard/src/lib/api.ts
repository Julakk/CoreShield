const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("coreshield_token") : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let message = "Request failed";
    try {
      const body = await res.json();
      message = body.error || body.errors?.[0]?.msg || message;
    } catch {
      message = res.statusText;
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export interface StatsResponse {
  generatedAt: string;
  activeBlocks: number;
  traffic: { requestsLast24h: number | null; note?: string };
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

export interface PublicStatus {
  status: string;
  protectedDomains: number;
  attacksBlockedLast24h: number;
  activeIpBlocks: number;
  avgResponseTimeMs: number | null;
  generatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string | null;
  details: Record<string, unknown> | null;
}

export interface SystemInfo {
  username: string;
  env: string;
  blockMethod: string;
  corsOrigins: string[];
  jwtExpiresIn: string;
}

export interface DomainRecord {
  id: string;
  domain: string;
  mode: "managed" | "existing";
  upstream: string | null;
  rateLimit: number | null;
  sslIssued: boolean;
  protectionEnabled: boolean;
  snippetPath: string | null;
  createdAt: string;
  status: string;
}

export interface BlockedIpRecord {
  ip: string;
  reason: string | null;
  blockedAt: string | null;
  expiresAt?: string | null;
  country?: string | null;
  countryCode?: string | null;
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
  getHistory: () => request<{ history: HistoryPoint[] }>("/stats/history"),

  getPublicStatus: () => request<PublicStatus>("/public/status"),

  getAuditLog: () => request<{ entries: AuditLogEntry[] }>("/audit-log"),

  listDomains: () => request<{ domains: DomainRecord[] }>("/domains"),

  addDomain: (
    domain: string,
    options?: {
      upstream?: string;
      rateLimit?: number;
      enableSsl?: boolean;
      enableProtection?: boolean;
      maxConnections?: number;
    }
  ) =>
    request<{ domain: DomainRecord }>("/domains", {
      method: "POST",
      body: JSON.stringify({ domain, ...options }),
    }),

  protectExistingDomain: (
    domain: string,
    options?: { rateLimit?: number; enableProtection?: boolean; maxConnections?: number }
  ) =>
    request<{
      domain: DomainRecord;
      snippetPath: string;
      zoneSnippetPath: string | null;
      instructions: string[];
    }>("/domains/protect-existing", {
      method: "POST",
      body: JSON.stringify({ domain, ...options }),
    }),

  removeDomain: (domain: string) =>
    request<{ domain: string; removed: boolean; warning?: string }>(
      `/domains/${encodeURIComponent(domain)}`,
      { method: "DELETE" }
    ),

  listBlockedIps: () => request<{ blocked: BlockedIpRecord[] }>("/security/block-ip"),

  blockIp: (ip: string, reason?: string) =>
    request("/security/block-ip", {
      method: "POST",
      body: JSON.stringify({ ip, reason }),
    }),

  unblockIp: (ip: string) =>
    request(`/security/block-ip/${encodeURIComponent(ip)}`, { method: "DELETE" }),
};
