import type { Project } from "@/entities/project";
import type { CurrentUser } from "@/entities/user";
import type { CurrentWorkspace } from "@/entities/workspace";
import { DashboardOverview } from "@/widgets/dashboard-overview";

type HomePageProps = {
  user: CurrentUser;
  workspace: CurrentWorkspace;
  projects: Project[];
};

export function HomePage({ user, workspace, projects }: HomePageProps) {
  return (
    <DashboardOverview
      displayName={user.displayName}
      workspace={workspace}
      projects={projects}
    />
  );
}
