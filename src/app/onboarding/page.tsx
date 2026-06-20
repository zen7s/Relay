import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { getPrimaryWorkspace } from "@/entities/workspace";
import { OnboardingPage } from "@/views/onboarding";

export const metadata: Metadata = { title: "Set up your workspace" };

export default async function OnboardingRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  const workspace = await getPrimaryWorkspace(user.id);

  if (workspace) {
    redirect("/");
  }

  return <OnboardingPage displayName={user.displayName} email={user.email} />;
}
