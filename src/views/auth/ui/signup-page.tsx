import Link from "next/link";

import { SignupForm } from "@/features/auth";
import { AuthShell } from "@/widgets/auth-shell";

export function SignupPage() {
  return (
    <AuthShell
      eyebrow="Start with clarity"
      title="Create your Relay account"
      description="Set up your workspace in less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
