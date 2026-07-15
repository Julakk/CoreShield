"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Plus, Trash2, Loader2 } from "lucide-react";
import { coreShieldApi, ApiError, DomainRecord } from "@/lib/api";

export default function DomainsPage() {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [domain, setDomain] = useState("");
  const [upstream, setUpstream] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removingDomain, setRemovingDomain] = useState<string | null>(null);

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await coreShieldApi.addDomain(domain.trim(), upstream.trim() || undefined);
      setDomain("");
      setUpstream("");
      await loadDomains();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to reach the server"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(d: string) {
    setRemovingDomain(d);
    try {
      await coreShieldApi.removeDomain(d);
      await loadDomains();
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to remove domain"
      );
    } finally {
      setRemovingDomain(null);
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
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Add domain
              </Button>
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
            <Badge variant="default">{domains.length} total</Badge>
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
            ) : (
              <div className="divide-y divide-border">
                {domains.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {d.domain}
                      </p>
                      <p className="text-xs text-foreground-subtle tabular-nums">
                        {d.upstream} · added{" "}
                        {new Date(d.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="success">{d.status}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={removingDomain === d.domain}
                        onClick={() => handleRemove(d.domain)}
                        aria-label={`Remove ${d.domain}`}
                      >
                        {removingDomain === d.domain ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
