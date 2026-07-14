"use client";

import { useEffect, useState } from "react";
import { coreShieldApi, StatsResponse } from "@/lib/api";

const DEMO_STATS: StatsResponse = {
  generatedAt: new Date().toISOString(),
  activeBlocks: 128,
  traffic: { requestsLast24h: 482_930 },
  attacksBlockedLast24h: 3421,
  protectedDomains: 6,
  avgResponseTimeMs: 118,
  cacheRate: 94.2,
};

export function useStats() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoData, setIsDemoData] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await coreShieldApi.getStats();
        if (!cancelled) {
          setStats(data);
          setIsDemoData(false);
        }
      } catch (err) {
        if (!cancelled) {
          setStats(DEMO_STATS);
          setIsDemoData(true);
          setError(err instanceof Error ? err.message : "Failed to load stats");
        }
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

  return { stats, loading, error, isDemoData };
}
