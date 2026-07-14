"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  ShieldAlert,
  BarChart3,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Account Home", href: "/", icon: LayoutDashboard },
  { label: "Domains", href: "/domains", icon: Globe },
  { label: "Security", href: "/security", icon: ShieldAlert },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-background-elevated h-screen sticky top-0">
      {/* Brand */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent-muted border border-accent/20">
          <ShieldCheck className="w-4 h-4 text-accent" />
        </div>
        <span className="text-sm font-semibold tracking-tight">
          CoreShield
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-wider text-foreground-subtle">
          Menu
        </p>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent-muted text-accent"
                  : "text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-border">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-foreground-muted hover:bg-surface-hover hover:text-foreground transition-colors"
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
