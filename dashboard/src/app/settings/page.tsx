"use client";

import { useEffect, useState, FormEvent } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { KeyRound, Server, Loader2 } from "lucide-react";
import { coreShieldApi, ApiError, SystemInfo } from "@/lib/api";

export default function SettingsPage() {
  const { showToast } = useToast();

  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    coreShieldApi
      .getSystemInfo()
      .then(setInfo)
      .catch(() => {
        // Non-critical — the card below just won't render if this fails.
      })
      .finally(() => setInfoLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("New password and confirmation don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await coreShieldApi.changePassword(currentPassword, newPassword);
      showToast("Password changed successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Failed to reach the server";
      setFormError(msg);
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <Topbar title="Settings" description="Account and API configuration" />
      <div className="p-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5" />
                Change password
              </CardTitle>
              <CardDescription className="mt-1">
                Update the admin password used to sign in to this dashboard.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">
                  Current password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">
                  New password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                  placeholder="At least 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground-muted">
                  Confirm new password
                </label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {formError && (
                <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2">
                  {formError}
                </p>
              )}

              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                Update password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-3.5 h-3.5" />
              System info
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {infoLoading ? (
              <div className="py-6 flex items-center justify-center text-foreground-subtle text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading…
              </div>
            ) : !info ? (
              <p className="text-xs text-foreground-subtle py-4">
                Could not load system info.
              </p>
            ) : (
              <div className="divide-y divide-border">
                <Row label="Username" value={info.username} />
                <Row
                  label="Environment"
                  value={<Badge variant="default">{info.env}</Badge>}
                />
                <Row
                  label="IP block method"
                  value={<Badge variant="accent">{info.blockMethod}</Badge>}
                />
                <Row
                  label="Allowed origins (CORS)"
                  value={info.corsOrigins.join(", ")}
                />
                <Row label="Session length" value={info.jwtExpiresIn} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <p className="text-xs text-foreground-subtle">{label}</p>
      <div className="text-sm text-foreground font-mono">{value}</div>
    </div>
  );
}
