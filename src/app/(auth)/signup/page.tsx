import type { Metadata } from "next";

import { SignupPage } from "@/views/auth";

export const metadata: Metadata = { title: "Create account" };

export default function SignupRoute() {
  return <SignupPage />;
}
