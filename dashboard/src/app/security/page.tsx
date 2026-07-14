import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

export default function SecurityPage() {
  return (
    <DashboardShell>
      <Topbar title="Security" description="Block and manage IP addresses" />
      <div className="p-6">
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-2">
            <ShieldAlert className="w-8 h-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              Wire this page to POST /security/block-ip from your CoreShield
              API.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
