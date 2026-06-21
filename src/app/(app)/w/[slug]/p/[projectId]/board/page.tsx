import { notFound, redirect } from "next/navigation";

import { getProjectBoard } from "@/entities/project";
import { getCurrentUser } from "@/entities/user";
import { getWorkspaceBySlug } from "@/entities/workspace";
import { ProjectBoardPage } from "@/views/project-board";

type ProjectBoardRouteProps = {
  params: Promise<{ slug: string; projectId: string }>;
};

export default async function ProjectBoardRoute({
  params,
}: ProjectBoardRouteProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug, projectId } = await params;
  const workspace = await getWorkspaceBySlug(user.id, slug);
  if (!workspace) notFound();

  const board = await getProjectBoard(workspace.id, projectId);
  if (!board) notFound();

  return <ProjectBoardPage workspace={workspace} board={board} />;
}
