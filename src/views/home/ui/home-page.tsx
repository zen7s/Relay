import type { CurrentUser } from "@/entities/user";
import type { CurrentWorkspace } from "@/entities/workspace";
import { AppShell } from "@/widgets/app-shell";
import { DashboardOverview } from "@/widgets/dashboard-overview";

type HomePageProps = {
  user: CurrentUser;
  workspace: CurrentWorkspace;
};

export function HomePage({ user, workspace }: HomePageProps) {
  return (
    <AppShell
      user={{ displayName: user.displayName, email: user.email }}
      workspace={{ name: workspace.name, role: workspace.role }}
    >
      <DashboardOverview
        displayName={user.displayName}
        workspaceName={workspace.name}
      />
    </AppShell>
  );
}
