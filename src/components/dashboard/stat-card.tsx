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
    /** Whether an upward trend is a good thing for this metric */
    positiveDirection: "up" | "down";
  };
  subtext?: string;
  accent?: "default" | "accent" | "success" | "danger";
}

const ACCENT_STYLES: Record<NonNullable<StatCardProps["accent"]>, string> = {
  default: "bg-surface-hover text-foreground-muted",
  accent: "bg-accent-muted text-accent",
  success: "bg-success-muted text-success",
  danger: "bg-danger-muted text-danger",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtext,
  accent = "default",
}: StatCardProps) {
  const isGood = trend && trend.direction === trend.positiveDirection;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <div
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md",
            ACCENT_STYLES[accent]
          )}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
      </CardHeader>
      <CardContent>
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
        {subtext && (
          <p className="mt-1 text-xs text-foreground-subtle">{subtext}</p>
        )}
      </CardContent>
    </Card>
  );
}
