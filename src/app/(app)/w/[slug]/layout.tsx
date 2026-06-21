import { notFound, redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { getUserWorkspaces } from "@/entities/workspace";
import { AppShell } from "@/widgets/app-shell";

type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>;

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ slug }, workspaces] = await Promise.all([
    params,
    getUserWorkspaces(user.id),
  ]);

  if (!workspaces.length) redirect("/onboarding");

  const workspace = workspaces.find((candidate) => candidate.slug === slug);
  if (!workspace) notFound();

  return (
    <AppShell
      user={{
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      }}
      workspace={workspace}
      workspaces={workspaces}
    >
      {children}
    </AppShell>
  );
}
