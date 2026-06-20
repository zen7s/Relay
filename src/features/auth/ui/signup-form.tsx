"use client";

import { useActionState } from "react";

import { signUpAction } from "../api/actions";
import { initialAuthActionState } from "../model/action-state";
import { AuthField, AuthFormStatus } from "./form-parts";
import { GoogleSignInButton } from "./google-sign-in-button";
import { SubmitButton } from "./submit-button";

export function SignupForm() {
  const [state, action] = useActionState(signUpAction, initialAuthActionState);

  return (
    <div className="space-y-5">
      <GoogleSignInButton next="/onboarding" />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or create an account with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-4" noValidate>
        <AuthField
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Alex Morgan"
          defaultValue={state.values?.fullName}
          error={state.fieldErrors?.fullName?.[0]}
          required
        />
        <AuthField
          label="Work email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          defaultValue={state.values?.email}
          error={state.fieldErrors?.email?.[0]}
          required
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={state.fieldErrors?.password?.[0]}
          required
        />
        <AuthField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword?.[0]}
          required
        />
        <AuthFormStatus state={state} />
        <SubmitButton
          idleLabel="Create account"
          pendingLabel="Creating account…"
        />
      </form>
    </div>
  );
}
