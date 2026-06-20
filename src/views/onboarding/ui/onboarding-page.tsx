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
        <span>
          Signed in as{" "}
          <span className="font-medium text-foreground">{email}</span>
        </span>
      }
    >
      <OnboardingForm defaultDisplayName={displayName} />
    </AuthShell>
  );
}
