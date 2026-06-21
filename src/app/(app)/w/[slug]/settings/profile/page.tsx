import { notFound, redirect } from "next/navigation";

import { getAccountDeletionBlockers, getCurrentUser } from "@/entities/user";
import { getWorkspaceBySlug } from "@/entities/workspace";
import { AccountSettingsPage } from "@/views/account-settings";

type AccountSettingsRouteProps = {
  params: Promise<{ slug: string }>;
};

export default async function AccountSettingsRoute({
  params,
}: AccountSettingsRouteProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { slug } = await params;
  const [workspace, blockers] = await Promise.all([
    getWorkspaceBySlug(user.id, slug),
    getAccountDeletionBlockers(),
  ]);
  if (!workspace) notFound();

  return (
    <AccountSettingsPage
      user={user}
      workspace={workspace}
      blockers={blockers}
    />
  );
}
