import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import {
  getWorkspaceBySlug,
  getWorkspaceInvitations,
  getWorkspaceMembers,
} from "@/entities/workspace";
import { WorkspaceMembersPage } from "@/views/workspace-members";

type WorkspaceMembersRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ transferred?: string }>;
};

export default async function WorkspaceMembersRoute({
  params,
  searchParams,
}: WorkspaceMembersRouteProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(user.id, slug);
  if (!workspace) notFound();

  const [members, invitations] = await Promise.all([
    getWorkspaceMembers(workspace.id),
    getWorkspaceInvitations(workspace.id),
  ]);

  return (
    <WorkspaceMembersPage
      workspace={workspace}
      currentUserId={user.id}
      members={members}
      invitations={invitations}
      transferred={query.transferred === "1"}
    />
  );
}
