"use client";

import { StatCard } from "@/components/dashboard/stat-card";
import { TrafficChartCard, TrafficPoint } from "@/components/dashboard/traffic-chart-card";
import { useStats } from "@/lib/use-stats";
import { formatNumber } from "@/lib/format";
import { ShieldAlert, Zap, Globe2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Demo hourly breakdown for the chart — swap for a real time-series
// endpoint on the backend (e.g. GET /stats/traffic?range=24h) when ready.
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
            value={
              loading
                ? "—"
                : formatNumber(stats?.attacksBlockedLast24h ?? 0)
            }
            icon={ShieldAlert}
            accent="danger"
            trend={{ value: "12.4%", direction: "up", positiveDirection: "up" }}
            subtext="Last 24 hours"
          />
          <StatCard
            title="Cache Rate"
            value="94.2%"
            icon={Zap}
            accent="accent"
            trend={{ value: "1.1%", direction: "down", positiveDirection: "up" }}
            subtext="Origin offload"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Requests"
          value={
            loading
              ? "—"
              : formatNumber(stats?.traffic.requestsLast24h ?? 0)
          }
          icon={Globe2}
          subtext="Last 24 hours"
        />
        <StatCard
          title="Active IP Blocks"
          value={loading ? "—" : formatNumber(stats?.activeBlocks ?? 0)}
          icon={ShieldAlert}
          accent="default"
          subtext="Currently enforced"
        />
        <StatCard
          title="Protected Domains"
          value="6"
          icon={Globe2}
          subtext="Active vhosts"
        />
        <StatCard
          title="Avg. Response Time"
          value="118ms"
          icon={Zap}
          trend={{ value: "4ms", direction: "down", positiveDirection: "down" }}
          subtext="p50 latency"
        />
      </div>
    </div>
  );
}
