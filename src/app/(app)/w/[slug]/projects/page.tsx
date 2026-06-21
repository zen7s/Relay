import { notFound, redirect } from "next/navigation";

import { getWorkspaceProjects } from "@/entities/project";
import { getCurrentUser } from "@/entities/user";
import { getWorkspaceBySlug } from "@/entities/workspace";
import { ProjectsPage } from "@/views/projects";

type ProjectsRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    archived?: string;
    saved?: string;
    changed?: string;
  }>;
};

export default async function ProjectsRoute({
  params,
  searchParams,
}: ProjectsRouteProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(user.id, slug);
  if (!workspace) notFound();

  const projects = await getWorkspaceProjects(workspace.id);
  const change =
    query.changed === "archived" || query.changed === "restored"
      ? query.changed
      : undefined;

  return (
    <ProjectsPage
      workspace={workspace}
      projects={projects}
      showArchived={query.archived === "1"}
      savedProjectId={query.saved}
      change={change}
    />
  );
}
