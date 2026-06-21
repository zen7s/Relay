import Link from "next/link";

import { LoginForm } from "@/features/auth";
import { getSafeRedirectPath } from "@/shared/lib";
import { AuthShell } from "@/widgets/auth-shell";

type LoginPageProps = {
  next?: string | undefined;
  error?: string | undefined;
};

export function LoginPage({ next, error }: LoginPageProps) {
  const destination = getSafeRedirectPath(next);

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign in to Relay"
      description="Pick up where your team left off."
      footer={
        <>
          New to Relay?{" "}
          <Link
            href={`/signup?next=${encodeURIComponent(destination)}`}
            className="font-medium text-primary hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm next={destination} initialError={error?.slice(0, 180)} />
    </AuthShell>
  );
}
