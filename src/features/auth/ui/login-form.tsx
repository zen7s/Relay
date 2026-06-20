"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signInAction } from "../api/actions";
import { initialAuthActionState } from "../model/action-state";
import { AuthField, AuthFormStatus } from "./form-parts";
import { GoogleSignInButton } from "./google-sign-in-button";
import { SubmitButton } from "./submit-button";

type LoginFormProps = {
  next?: string | undefined;
  initialError?: string | undefined;
};

export function LoginForm({ next = "/", initialError }: LoginFormProps) {
  const [state, action] = useActionState(signInAction, {
    ...initialAuthActionState,
    ...(initialError
      ? { status: "error" as const, message: initialError }
      : {}),
  });

  return (
    <div className="space-y-5">
      <GoogleSignInButton next={next} />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or continue with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form action={action} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />
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
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password?.[0])}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20"
          />
          {state.fieldErrors?.password?.[0] ? (
            <p className="text-xs text-destructive">
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>
        <AuthFormStatus state={state} />
        <SubmitButton idleLabel="Sign in" pendingLabel="Signing in…" />
      </form>
    </div>
  );
}
