import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { ResetPasswordPage } from "@/views/auth";

export const metadata: Metadata = { title: "Choose new password" };

export default async function ResetPasswordRoute() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/forgot-password");
  }

  return <ResetPasswordPage />;
}
