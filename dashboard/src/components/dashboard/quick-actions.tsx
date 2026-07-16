import Link from "next/link";
import { Globe, Ban, BarChart3, ArrowRight } from "lucide-react";

const ACTIONS = [
  {
    href: "/domains",
    label: "Add a domain",
    description: "Protect a new site behind Nginx",
    icon: Globe,
    accent: "text-accent bg-accent-muted",
  },
  {
    href: "/security",
    label: "Block an IP",
    description: "Stop traffic from a bad actor",
    icon: Ban,
    accent: "text-danger bg-danger-muted",
  },
  {
    href: "/analytics",
    label: "View analytics",
    description: "See traffic and response trends",
    icon: BarChart3,
    accent: "text-warning bg-warning-muted",
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-border-subtle hover:shadow-lg hover:shadow-black/20"
        >
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-md shrink-0 transition-transform duration-200 group-hover:scale-105 ${action.accent}`}
          >
            <action.icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              {action.label}
            </p>
            <p className="text-xs text-foreground-subtle truncate">
              {action.description}
            </p>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-foreground-subtle shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground-muted" />
        </Link>
      ))}
    </div>
  );
}
