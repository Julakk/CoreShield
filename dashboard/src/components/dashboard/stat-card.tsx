import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: "up" | "down";
    positiveDirection: "up" | "down";
  };
  subtext?: string;
  accent?: "default" | "accent" | "success" | "danger";
  loading?: boolean;
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "bg-surface-hover text-foreground-muted",
  accent: "bg-accent-muted text-accent",
  success: "bg-success-muted text-success",
  danger: "bg-danger-muted text-danger",
};

const ACCENT_GLOW: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "group-hover:border-border-subtle",
  accent: "group-hover:border-accent/30",
  success: "group-hover:border-success/30",
  danger: "group-hover:border-danger/30",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  accent = "default",
  loading = false,
}: StatCardProps) {
  const isGood = trend && trend.direction === trend.positiveDirection;

  return (
    <Card
      className={cn(
        "group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20",
        ACCENT_GLOW[accent]
      )}
    >
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md transition-transform duration-200 group-hover:scale-110",
            ACCENT_STYLES[accent]
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-7 w-20 rounded bg-surface-hover animate-pulse" />
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "flex items-center gap-0.5 text-xs font-medium",
                  isGood ? "text-success" : "text-danger"
                )}
              >
                {trend.direction === "up" ? (
                  <ArrowUp className="w-3 h-3" />
                ) : (
                  <ArrowDown className="w-3 h-3" />
                )}
                {trend.value}
              </span>
            )}
          </div>
        )}
        {subtext && (
          <p className="mt-1 text-xs text-foreground-subtle">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}
