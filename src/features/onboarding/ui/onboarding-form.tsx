"use client";

import { LoaderCircle } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button, Input, Label } from "@/shared/ui";

import {
  completeOnboardingAction,
  type OnboardingActionState,
} from "../api/actions";

function OnboardingSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-10 w-full" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {pending ? "Creating workspace…" : "Create workspace"}
    </Button>
  );
}

type OnboardingFormProps = {
  defaultDisplayName: string;
};

const initialState: OnboardingActionState = { status: "idle" };

export function OnboardingForm({ defaultDisplayName }: OnboardingFormProps) {
  const [state, action] = useActionState(
    completeOnboardingAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="displayName">Your name</Label>
        <Input
          id="displayName"
          name="displayName"
          autoComplete="name"
          defaultValue={state.values?.displayName ?? defaultDisplayName}
          aria-invalid={Boolean(state.fieldErrors?.displayName?.[0])}
          className="h-10"
          required
        />
        {state.fieldErrors?.displayName?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.displayName[0]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            This is how teammates will see you.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="workspaceName">Workspace name</Label>
        <Input
          id="workspaceName"
          name="workspaceName"
          placeholder="Northstar Studio"
          defaultValue={state.values?.workspaceName}
          aria-invalid={Boolean(state.fieldErrors?.workspaceName?.[0])}
          className="h-10"
          required
        />
        {state.fieldErrors?.workspaceName?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.workspaceName[0]}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            You can invite teammates in the next step.
          </p>
        )}
      </div>

      {state.message ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {state.message}
        </p>
      ) : null}

      <OnboardingSubmitButton />
    </form>
  );
}
