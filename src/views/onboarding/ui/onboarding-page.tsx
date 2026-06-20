import { signOutAction } from "@/features/auth";
import { OnboardingForm } from "@/features/onboarding";
import { AuthShell } from "@/widgets/auth-shell";

type OnboardingPageProps = {
  displayName: string;
  email: string;
};

export function OnboardingPage({ displayName, email }: OnboardingPageProps) {
  return (
    <AuthShell
      eyebrow="One last step"
      title="Create your first workspace"
      description="Give your team a home. You can adjust these details later."
      footer={
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>
            Signed in as{" "}
            <span className="font-medium text-foreground">{email}</span>
          </span>
          <form action={signOutAction}>
            <button
              type="submit"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Use another account
            </button>
          </form>
        </div>
      }
    >
      <OnboardingForm defaultDisplayName={displayName} />
    </AuthShell>
  );
}
