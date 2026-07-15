"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ShieldOff, Loader2, Ban } from "lucide-react";
import { coreShieldApi, ApiError, BlockedIpRecord } from "@/lib/api";

export default function SecurityPage() {
  const [blocked, setBlocked] = useState<BlockedIpRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [removingIp, setRemovingIp] = useState<string | null>(null);

  async function loadBlocked() {
    setLoading(true);
    setLoadError(null);
    try {
      const { blocked } = await coreShieldApi.listBlockedIps();
      setBlocked(blocked);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to reach the server"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBlocked();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await coreShieldApi.blockIp(ip.trim(), reason.trim() || undefined);
      setIp("");
      setReason("");
      await loadBlocked();
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Failed to reach the server"
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUnblock(targetIp: string) {
    setRemovingIp(targetIp);
    try {
      await coreShieldApi.unblockIp(targetIp);
      await loadBlocked();
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Failed to unblock IP"
      );
    } finally {
      setRemovingIp(null);
    }
  }

  return (
    <DashboardShell>
      <Topbar title="Security" description="Block and manage IP addresses" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ban className="w-3.5 h-3.5" />
              Block an IP address
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="203.0.113.42"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent/50 font-mono tabular-nums"
              />
              <input
                type="text"
                placeholder="Reason (optional)"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Ban className="w-3.5 h-3.5" />
                )}
                Block IP
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
              <ShieldAlert className="w-3.5 h-3.5" />
              Currently blocked
            </CardTitle>
            <Badge variant="danger">{blocked.length} active</Badge>
          </CardHeader>
          <CardContent className="pt-2">
            {loading ? (
              <div className="py-10 flex items-center justify-center text-foreground-subtle text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading blocked IPs…
              </div>
            ) : loadError ? (
              <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2">
                {loadError}
              </p>
            ) : blocked.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center gap-2">
                <ShieldOff className="w-8 h-8 text-foreground-subtle" />
                <p className="text-sm text-foreground-muted">
                  No IPs currently blocked.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {blocked.map((b) => (
                  <div
                    key={b.ip}
                    className="flex items-center justify-between py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground font-mono tabular-nums">
                        {b.ip}
                      </p>
                      <p className="text-xs text-foreground-subtle">
                        {b.reason || "No reason given"}
                        {b.blockedAt &&
                          ` · ${new Date(b.blockedAt).toLocaleString()}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="danger">blocked</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={removingIp === b.ip}
                        onClick={() => handleUnblock(b.ip)}
                      >
                        {removingIp === b.ip ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Unblock"
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
