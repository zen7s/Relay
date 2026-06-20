import { AppShell } from "@/widgets/app-shell";
import { DashboardOverview } from "@/widgets/dashboard-overview";

export function HomePage() {
  return (
    <AppShell>
      <DashboardOverview />
    </AppShell>
  );
}
