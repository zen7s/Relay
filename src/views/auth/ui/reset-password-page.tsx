import { ResetPasswordForm } from "@/features/auth";
import { AuthShell } from "@/widgets/auth-shell";

export function ResetPasswordPage() {
  return (
    <AuthShell
      eyebrow="Choose a new password"
      title="Secure your account"
      description="Use a unique password with at least 8 characters."
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
