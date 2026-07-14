import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <Topbar title="Analytics" description="Traffic and threat analytics" />
      <div className="p-6">
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-2">
            <BarChart3 className="w-8 h-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              Extend /stats on the backend with historical time-series data
              to power charts here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
