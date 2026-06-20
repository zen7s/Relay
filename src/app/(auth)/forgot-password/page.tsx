import type { Metadata } from "next";

import { ForgotPasswordPage } from "@/views/auth";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}
