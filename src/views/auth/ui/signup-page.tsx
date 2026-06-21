import Link from "next/link";

import { SignupForm } from "@/features/auth";
import { getSafeRedirectPath } from "@/shared/lib";
import { AuthShell } from "@/widgets/auth-shell";

type SignupPageProps = {
  next?: string | undefined;
};

export function SignupPage({ next }: SignupPageProps) {
  const destination = getSafeRedirectPath(next, "/onboarding");

  return (
    <AuthShell
      eyebrow="Start with clarity"
      title="Create your Relay account"
      description="Set up your workspace in less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(destination)}`}
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm next={destination} />
    </AuthShell>
  );
}
