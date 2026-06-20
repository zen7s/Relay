"use client";

import { useActionState } from "react";

import { resetPasswordAction } from "../api/actions";
import { initialAuthActionState } from "../model/action-state";
import { AuthField, AuthFormStatus } from "./form-parts";
import { SubmitButton } from "./submit-button";

export function ResetPasswordForm() {
  const [state, action] = useActionState(
    resetPasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        error={state.fieldErrors?.password?.[0]}
        required
      />
      <AuthField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword?.[0]}
        required
      />
      <AuthFormStatus state={state} />
      <SubmitButton idleLabel="Update password" pendingLabel="Updating…" />
    </form>
  );
}
