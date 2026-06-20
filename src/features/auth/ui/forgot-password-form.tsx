"use client";

import { useActionState } from "react";

import { forgotPasswordAction } from "../api/actions";
import { initialAuthActionState } from "../model/action-state";
import { AuthField, AuthFormStatus } from "./form-parts";
import { SubmitButton } from "./submit-button";

export function ForgotPasswordForm() {
  const [state, action] = useActionState(
    forgotPasswordAction,
    initialAuthActionState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@company.com"
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email?.[0]}
        required
      />
      <AuthFormStatus state={state} />
      <SubmitButton idleLabel="Send reset link" pendingLabel="Sending link…" />
    </form>
  );
}
