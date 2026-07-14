"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export interface TrafficPoint {
  time: string;
  requests: number;
  blocked: number;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name: string; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-background-elevated px-3 py-2 shadow-lg">
      <p className="text-xs text-foreground-subtle mb-1">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.name}
          className="text-xs font-medium tabular-nums flex items-center gap-1.5"
          style={{ color: entry.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export function TrafficChartCard({ data }: { data: TrafficPoint[] }) {
  const totalRequests = data.reduce((sum, d) => sum + d.requests, 0);

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5" />
            Web Traffic
          </CardTitle>
          <CardDescription className="mt-1">
            Requests over the last 24 hours
          </CardDescription>
        </div>
        <Badge variant="accent">{totalRequests.toLocaleString()} total</Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22e5c9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#22e5c9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="blockedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#22252b"
                vertical={false}
              />
              <XAxis
                dataKey="time"
                tick={{ fill: "#6b6e75", fontSize: 11 }}
                axisLine={{ stroke: "#22252b" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#6b6e75", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="requests"
                name="Requests"
                stroke="#22e5c9"
                strokeWidth={2}
                fill="url(#requestsGradient)"
              />
              <Area
                type="monotone"
                dataKey="blocked"
                name="Blocked"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#blockedGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
