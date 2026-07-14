import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";

export default function DomainsPage() {
  return (
    <DashboardShell>
      <Topbar title="Domains" description="Manage protected domains" />
      <div className="p-6">
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-2">
            <Globe className="w-8 h-8 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">
              Wire this page to GET /domains and POST /domains from your
              CoreShield API.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
