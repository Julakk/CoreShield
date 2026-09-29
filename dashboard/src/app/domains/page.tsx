"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { Globe, Plus, Trash2, Loader2, Lock, Gauge, Download, Search, ShieldCheck } from "lucide-react";
import { coreShieldApi, ApiError, DomainRecord } from "@/lib/api";
import { downloadCsv } from "@/lib/csv-export";
import { SearchInput } from "@/components/ui/search-input";

export default function DomainsPage() {
  const { showToast } = useToast();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [domain, setDomain] = useState("");
  const [upstream, setUpstream] = useState("");
  const [rateLimit, setRateLimit] = useState("");
  const [enableSsl, setEnableSsl] = useState(false);
  const [enableProtection, setEnableProtection] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function loadDomains() {
    setLoading(true);
    setLoadError(null);
    try {
      const { domains } = await coreShieldApi.listDomains();
      setDomains(domains);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to reach the server"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDomains();
  }, []);

  const filteredDomains = domains.filter((d) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      d.domain.toLowerCase().includes(q) ||
      (d.upstream ?? "").toLowerCase().includes(q)
    );
  });

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const result = await coreShieldApi.addDomain(domain.trim(), {
        upstream: upstream.trim() || undefined,
        rateLimit: rateLimit ? Number(rateLimit) : undefined,
        enableSsl: enableSsl || undefined,
        enableProtection: enableProtection || undefined,
      });
      const sslNote = enableSsl
        ? result.domain.sslIssued
          ? " SSL certificate issued."
          : " SSL issuance failed (check DNS/certbot on the server) — domain is still live over HTTP."
        : "";
      const protectionNote = enableProtection
        ? " Advanced Protection (WAF + bad-bot blocking + connection limits) is active."
        : "";
      showToast(`${domain.trim()} added and Nginx reloaded.${sslNote}${protectionNote}`, "success");
      setDomain("");
      setUpstream("");
      setRateLimit("");
      setEnableSsl(false);
      setEnableProtection(false);
      await loadDomains();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to reach the server";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmRemove() {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      await coreShieldApi.removeDomain(pendingRemove);
      showToast(`${pendingRemove} removed.`, "success");
      await loadDomains();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to remove domain";
      setLoadError(msg);
      showToast(msg, "error");
    } finally {
      setRemoving(false);
      setPendingRemove(null);
    }
  }

  return (
    <DashboardShell>
      <Topbar title="Domains" description="Manage protected domains" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-3.5 h-3.5" />
              Add a domain
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  placeholder="app.example.com"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
                <input
                  type="text"
                  placeholder="upstream (optional, e.g. 127.0.0.1:8080)"
                  value={upstream}
                  onChange={(e) => setUpstream(e.target.value)}
                  className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Gauge className="w-3.5 h-3.5 text-foreground-subtle shrink-0" />
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    placeholder="Rate limit, req/s (optional)"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 tabular-nums"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer select-none px-1">
                  <input
                    type="checkbox"
                    checked={enableSsl}
                    onChange={(e) => setEnableSsl(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent"
                  />
                  <Lock className="w-3.5 h-3.5" />
                  Auto SSL
                </label>

                <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer select-none px-1">
                  <input
                    type="checkbox"
                    checked={enableProtection}
                    onChange={(e) => setEnableProtection(e.target.checked)}
                    className="w-4 h-4 rounded border-border accent-accent"
                  />
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Advanced Protection
                </label>

                <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                  {submitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Add domain
                </Button>
              </div>

              {enableProtection && (
                <p className="text-xs text-foreground-subtle bg-accent-muted border border-accent/20 rounded-md px-3 py-2">
                  Advanced Protection blocks common attack patterns
                  (SQLi/XSS/path traversal), known scanner tools by
                  User-Agent, and limits concurrent connections per IP —
                  Nginx-level WAF-lite, not a substitute for validating
                  input in your app itself.
                </p>
              )}
            </form>
            {formError && (
              <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2 mt-3">
                {formError}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Protected domains
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search domains…"
              />
              <Badge variant="default">{filteredDomains.length} of {domains.length}</Badge>
              <Button
                variant="ghost"
                size="sm"
                disabled={filteredDomains.length === 0}
                onClick={() =>
                  downloadCsv(
                    filteredDomains.map((d) => ({
                      domain: d.domain,
                      upstream: d.upstream,
                      rateLimit: d.rateLimit ?? "",
                      sslIssued: d.sslIssued,
                      protectionEnabled: d.protectionEnabled,
                      status: d.status,
                      createdAt: d.createdAt,
                    })),
                    `coreshield-domains-${new Date().toISOString().slice(0, 10)}.csv`
                  )
                }
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="py-10 flex items-center justify-center text-foreground-subtle text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading domains…
              </div>
            ) : loadError ? (
              <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2">
                {loadError}
              </p>
            ) : domains.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
                <Globe className="w-8 h-8 text-foreground-subtle" />
                <p className="text-sm text-foreground-muted">
                  No domains registered yet. Add one above.
                </p>
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
                <Search className="w-8 h-8 text-foreground-subtle" />
                <p className="text-sm text-foreground-muted">
                  No domains match &quot;{search}&quot;.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredDomains.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {d.domain}
                      </p>
                      <p className="text-xs text-foreground-subtle tabular-nums">
                        {d.upstream} · added{" "}
                        {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {d.protectionEnabled && (
                        <Badge variant="accent">
                          <ShieldCheck className="w-3 h-3" />
                          Protected
                        </Badge>
                      )}
                      {d.sslIssued && (
                        <Badge variant="accent">
                          <Lock className="w-3 h-3" />
                          SSL
                        </Badge>
                      )}
                      {d.rateLimit && (
                        <Badge variant="default">{d.rateLimit} req/s</Badge>
                      )}
                      <Badge variant="success">{d.status}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingRemove(d.domain)}
                        aria-label={`Remove ${d.domain}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={pendingRemove !== null}
        title={`Remove ${pendingRemove}?`}
        description="This will remove the Nginx vhost config and reload Nginx. This can't be undone from here."
        confirmLabel="Remove"
        variant="danger"
        loading={removing}
        onConfirm={confirmRemove}
        onCancel={() => setPendingRemove(null)}
      />
    </DashboardShell>
  );
}
