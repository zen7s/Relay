import { redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";

export default async function PrivateAppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return children;
}
