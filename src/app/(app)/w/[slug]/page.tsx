import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { getWorkspaceBySlug } from "@/entities/workspace";
import { HomePage } from "@/views/home";

type WorkspaceOverviewRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function WorkspaceOverviewRoute({
  params,
}: WorkspaceOverviewRouteProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const workspace = await getWorkspaceBySlug(user.id, slug);
  if (!workspace) notFound();

  return <HomePage user={user} workspace={workspace} />;
}
