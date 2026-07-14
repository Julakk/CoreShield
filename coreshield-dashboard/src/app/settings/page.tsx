import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <Topbar title="Settings" description="Account and API configuration" />
      <div className="p-6">
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-2">
            <Settings className="w-8 h-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">Settings coming soon.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
