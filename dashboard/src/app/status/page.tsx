"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShieldCheck, Globe2, ShieldAlert, Ban, Zap, ArrowRight } from "lucide-react";
import { coreShieldApi, ApiError, PublicStatus } from "@/lib/api";
import { formatNumber } from "@/lib/format";

export default function PublicStatusPage() {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreachable, setUnreachable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await coreShieldApi.getPublicStatus();
        if (!cancelled) {
          setStatus(data);
          setUnreachable(false);
        }
      } catch (err) {
        if (!cancelled) setUnreachable(true);
        void err;
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(var(--border-subtle) 1px, transparent 1px), linear-gradient(90deg, var(--border-subtle) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 50% at 50% 0%, black 0%, transparent 75%)",
          opacity: 0.5,
        }}
      />
      <div
        className="pointer-events-none absolute w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          opacity: 0.07,
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 py-16">
        <div className="flex flex-col items-center text-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-accent-muted border border-accent/20">
            <ShieldCheck className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              CoreShield Status
            </h1>
            <p className="text-sm text-foreground-subtle mt-1">
              Live protection status for infrastructure secured by CoreShield
            </p>
          </div>

          {unreachable ? (
            <div className="flex items-center gap-2 rounded-full border border-warning/20 bg-warning-muted px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-sm font-medium text-warning">
                Status temporarily unavailable
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-success/20 bg-success-muted px-4 py-1.5">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-success opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-success" />
              </span>
              <span className="text-sm font-medium text-success">
                All systems operational
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
          <PublicStat
            icon={Globe2}
            label="Domains protected"
            value={loading ? "—" : unreachable ? "—" : formatNumber(status!.protectedDomains)}
          />
          <PublicStat
            icon={ShieldAlert}
            label="Threats blocked (24h)"
            value={loading ? "—" : unreachable ? "—" : formatNumber(status!.attacksBlockedLast24h)}
            accent="danger"
          />
          <PublicStat
            icon={Ban}
            label="Active IP blocks"
            value={loading ? "—" : unreachable ? "—" : formatNumber(status!.activeIpBlocks)}
          />
          <PublicStat
            icon={Zap}
            label="Avg. response time"
            value={
              loading || unreachable
                ? "—"
                : status!.avgResponseTimeMs != null
                  ? `${status!.avgResponseTimeMs}ms`
                  : "N/A"
            }
            accent="accent"
          />
        </div>

        <div className="rounded-lg border border-border bg-surface/60 backdrop-blur p-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <h2 className="text-sm font-semibold text-foreground mb-2">
            What is CoreShield?
          </h2>
          <p className="text-sm text-foreground-muted leading-relaxed">
            CoreShield is a self-hosted security layer that protects web
            infrastructure with automatic Nginx-based domain protection,
            IP blocking via CrowdSec or iptables, and real-time traffic
            monitoring — all from one dashboard. This page shows the live,
            aggregate protection status without exposing any sensitive
            infrastructure details.
          </p>
        </div>

        <div className="flex items-center justify-center">
          <Link
            href="/login"
            className="group inline-flex items-center gap-1.5 text-xs text-foreground-subtle hover:text-foreground-muted transition-colors"
          >
            Team member? Sign in
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function PublicStat({
  icon: Icon,
  label,
  value,
  accent = "default",
}: {
  icon: typeof Globe2;
  label: string;
  value: string;
  accent?: "default" | "accent" | "danger";
}) {
  const accentStyles = {
    default: "bg-surface-hover text-foreground-muted",
    accent: "bg-accent-muted text-accent",
    danger: "bg-danger-muted text-danger",
  }[accent];

  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-4 text-center">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-md mb-2 ${accentStyles}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      <p className="text-xs text-foreground-subtle mt-0.5">{label}</p>
    </div>
  );
}
