import type { CurrentUser } from "@/entities/user";
import type { CurrentWorkspace } from "@/entities/workspace";
import { DashboardOverview } from "@/widgets/dashboard-overview";

type HomePageProps = {
  user: CurrentUser;
  workspace: CurrentWorkspace;
};

export function HomePage({ user, workspace }: HomePageProps) {
  return (
    <DashboardOverview
      displayName={user.displayName}
      workspaceName={workspace.name}
    />
  );
}
