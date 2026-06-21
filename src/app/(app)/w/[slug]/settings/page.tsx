import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { getWorkspaceBySlug } from "@/entities/workspace";
import { WorkspaceSettingsPage } from "@/views/workspace-settings";

type WorkspaceSettingsRouteProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; leave?: string }>;
};

export default async function WorkspaceSettingsRoute({
  params,
  searchParams,
}: WorkspaceSettingsRouteProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(user.id, slug);
  if (!workspace) notFound();

  return (
    <WorkspaceSettingsPage
      workspace={workspace}
      saved={query.saved === "workspace"}
      ownerLeaveBlocked={query.leave === "owner"}
    />
  );
}
