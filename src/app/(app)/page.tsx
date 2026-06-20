import { redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { getPrimaryWorkspace } from "@/entities/workspace";
import { HomePage } from "@/views/home";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const workspace = await getPrimaryWorkspace(user.id);

  if (!workspace) {
    redirect("/onboarding");
  }

  return <HomePage user={user} workspace={workspace} />;
}
