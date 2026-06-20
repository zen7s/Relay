import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ForgotPasswordForm } from "@/features/auth";
import { AuthShell } from "@/widgets/auth-shell";

export function ForgotPasswordPage() {
  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email and we’ll send a secure reset link."
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-2 font-medium text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
