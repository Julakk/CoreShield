"use client";

import { useEffect, useState } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrafficChartCard, TrafficPoint } from "@/components/dashboard/traffic-chart-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { useStats } from "@/lib/use-stats";
import { formatNumber } from "@/lib/format";
import { ShieldAlert, Zap, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DEMO_TRAFFIC: TrafficPoint[] = [
  { time: "00:00", requests: 12400, blocked: 210 },
  { time: "03:00", requests: 9800, blocked: 180 },
  { time: "06:00", requests: 15200, blocked: 340 },
  { time: "09:00", requests: 28900, blocked: 610 },
  { time: "12:00", requests: 34100, blocked: 720 },
  { time: "15:00", requests: 31200, blocked: 590 },
  { time: "18:00", requests: 26700, blocked: 480 },
  { time: "21:00", requests: 19300, blocked: 310 },
];

function displayValue(
  loading: boolean,
  value: number | null | undefined,
  suffix = ""
): string {
  if (loading) return "—";
  if (value === null || value === undefined) return "N/A";
  return `${formatNumber(value)}${suffix}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardGrid() {
  const { stats, loading, error, isDemoData } = useStats();
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            {greeting ? `${greeting}.` : "Welcome back."} Here's what's happening.
          </h2>
          <p className="text-xs text-foreground-subtle mt-0.5">
            {loading
              ? "Refreshing stats…"
              : `Last updated ${new Date(stats?.generatedAt ?? Date.now()).toLocaleTimeString()}`}
          </p>
        </div>
      </div>

      <QuickActions />

      {isDemoData && !loading && (
        <Badge variant="warning" className="w-fit">
          Showing demo data — backend unreachable{error ? `: ${error}` : ""}
        </Badge>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrafficChartCard data={DEMO_TRAFFIC} />

        <div className="grid grid-cols-1 gap-4">
          <StatCard
            title="Attack Threats Blocked"
            value={displayValue(loading, stats?.attacksBlockedLast24h)}
            loading={loading}
            icon={ShieldAlert}
            accent="danger"
            subtext="Active CrowdSec decisions"
          />
          <StatCard
            title="Cache Rate"
            value={displayValue(loading, stats?.cacheRate, "%")}
            loading={loading}
            icon={Zap}
            accent="accent"
            subtext={
              stats?.cacheRate == null && !loading
                ? "Not configured yet"
                : "Origin offload"
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={displayValue(loading, stats?.traffic.requestsLast24h)}
          loading={loading}
          icon={Globe2}
          subtext={stats?.traffic.requestsLast24h == null && !loading ? "Not configured yet" : "Last 24 hours"}
        />
        <StatCard
          title="Active IP Blocks"
          value={displayValue(loading, stats?.activeBlocks)}
          loading={loading}
          icon={ShieldAlert}
          accent="default"
          subtext="Currently enforced"
        />
        <StatCard
          title="Protected Domains"
          value={displayValue(loading, stats?.protectedDomains)}
          loading={loading}
          icon={Globe2}
          subtext="Active vhosts"
        />
        <StatCard
          title="API Response Time"
          value={displayValue(loading, stats?.avgResponseTimeMs, "ms")}
          loading={loading}
          icon={Zap}
          subtext="Average, last 500 requests"
        />
      </div>
    </div>
  );
}
