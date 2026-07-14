"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { TrafficChartCard, TrafficPoint } from "@/components/dashboard/traffic-chart-card";
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

export function DashboardGrid() {
  const { stats, loading, error, isDemoData } = useStats();

  return (
    <div className="p-6 space-y-6">
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
            icon={ShieldAlert}
            accent="danger"
            subtext="Last 24 hours"
          />
          <StatCard
            title="Cache Rate"
            value={displayValue(loading, stats?.cacheRate, "%")}
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
          icon={Globe2}
          subtext="Last 24 hours"
        />
        <StatCard
          title="Active IP Blocks"
          value={displayValue(loading, stats?.activeBlocks)}
          icon={ShieldAlert}
          accent="default"
          subtext="Currently enforced"
        />
        <StatCard
          title="Protected Domains"
          value={displayValue(loading, stats?.protectedDomains)}
          icon={Globe2}
          subtext="Active vhosts"
        />
        <StatCard
          title="Avg. Response Time"
          value={displayValue(loading, stats?.avgResponseTimeMs, "ms")}
          icon={Zap}
          subtext="p50 latency"
        />
      </div>
    </div>
  );
}
