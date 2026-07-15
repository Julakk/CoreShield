"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Loader2 } from "lucide-react";
import { coreShieldApi, ApiError, HistoryPoint } from "@/lib/api";
import { formatNumber } from "@/lib/format";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <p className="text-xs text-foreground-subtle mb-1">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="text-xs font-medium tabular-nums text-accent">
          {entry.name}: {formatNumber(entry.value)}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { history } = await coreShieldApi.getHistory();
        if (!cancelled) setHistory(history);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : "Failed to reach the server"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const totalRequests = history.reduce((sum, h) => sum + h.requests, 0);
  const activeHours = history.filter((h) => h.requests > 0).length;

  return (
    <DashboardShell>
      <Topbar title="Analytics" description="Traffic and threat analytics" />
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-3.5 h-3.5" />
                Requests to this API — last 24 hours
              </CardTitle>
              <CardDescription className="mt-1">
                Real request counts recorded by the CoreShield backend
                itself (not Nginx-wide traffic yet)
              </CardDescription>
            </div>
            <Badge variant="accent">{formatNumber(totalRequests)} total</Badge>
          </CardHeader>
          <CardContent className="pt-4">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-foreground-subtle text-sm gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading history…
              </div>
            ) : error ? (
              <p className="text-xs text-danger bg-danger-muted border border-danger/20 rounded-md px-3 py-2">
                {error}
              </p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="reqGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22e5c9" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#22e5c9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#22252b" vertical={false} />
                    <XAxis
                      dataKey="hour"
                      tick={{ fill: "#6b6e75", fontSize: 11 }}
                      axisLine={{ stroke: "#22252b" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#6b6e75", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      width={32}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Requests"
                      stroke="#22e5c9"
                      strokeWidth={2}
                      fill="url(#reqGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-5">
              <p className="text-xs text-foreground-subtle mb-1">
                Active hours (last 24h)
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {loading ? "—" : `${activeHours} / 24`}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5">
              <p className="text-xs text-foreground-subtle mb-1">
                Total requests tracked
              </p>
              <p className="text-2xl font-semibold tabular-nums text-foreground">
                {loading ? "—" : formatNumber(totalRequests)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-2">
            <BarChart3 className="w-8 h-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted max-w-md">
              This chart tracks requests hitting the CoreShield API itself.
              For site-wide traffic and threat trends across your protected
              domains, wire this page up to Nginx access-log aggregation or
              CrowdSec's event stream.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
