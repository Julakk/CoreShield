import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";

export default function Home() {
  return (
    <DashboardShell>
      <Topbar
        title="Account Home"
        description="Overview of your protected infrastructure"
      />
      <DashboardGrid />
    </DashboardShell>
  );
}
