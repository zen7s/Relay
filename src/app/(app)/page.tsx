import { redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { getPrimaryWorkspace } from "@/entities/workspace";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await getPrimaryWorkspace(user.id);

  if (!workspace) {
    redirect("/onboarding");
  }

  redirect(`/w/${workspace.slug}`);
}
