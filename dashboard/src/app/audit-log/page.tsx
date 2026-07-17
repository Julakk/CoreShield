"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { History, Loader2, Download } from "lucide-react";
import { coreShieldApi, ApiError, AuditLogEntry } from "@/lib/api";
import { downloadCsv } from "@/lib/csv-export";

const ACTION_LABELS: Record<string, { label: string; variant: "success" | "danger" | "warning" | "default" | "accent" }> = {
  "domain.add": { label: "Domain added", variant: "success" },
  "domain.remove": { label: "Domain removed", variant: "warning" },
  "security.block_ip": { label: "IP blocked", variant: "danger" },
  "security.unblock_ip": { label: "IP unblocked", variant: "success" },
  "auth.login": { label: "Login", variant: "default" },
  "auth.login_failed": { label: "Login failed", variant: "danger" },
  "auth.password_changed": { label: "Password changed", variant: "warning" },
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { entries } = await coreShieldApi.getAuditLog();
      setEntries(entries);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reach the server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  function handleExport() {
    downloadCsv(
      entries.map((e) => ({
        timestamp: e.timestamp,
        actor: e.actor,
        action: e.action,
        target: e.target ?? "",
        details: e.details ? JSON.stringify(e.details) : "",
      })),
      `coreshield-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    );
  }

  return (
    <DashboardShell>
      <Topbar title="Audit Log" description="History of security-relevant actions" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-3.5 h-3.5" />
              Recent activity
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="default">{entries.length} entries</Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={entries.length === 0}
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
                Loading audit log…
              </div>
            ) : error ? (
              <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2">
                {error}
              </p>
            ) : entries.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
                <History className="w-8 h-8 text-foreground-subtle" />
                <p className="text-sm text-foreground-muted">
                  No activity recorded yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {entries.map((e) => {
                  const meta = ACTION_LABELS[e.action] ?? {
                    label: e.action,
                    variant: "default" as const,
                  };
                  return (
                    <div key={e.id} className="flex items-start justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          {e.target && (
                            <span className="text-sm text-foreground font-mono truncate">
                              {e.target}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-subtle mt-1">
                          by <span className="text-foreground-muted">{e.actor}</span>
                          {e.details && (
                            <span className="ml-2 font-mono">
                              {Object.entries(e.details)
                                .map(([k, v]) => `${k}=${v}`)
                                .join(" ")}
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-foreground-subtle tabular-nums shrink-0">
                        {new Date(e.timestamp).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
