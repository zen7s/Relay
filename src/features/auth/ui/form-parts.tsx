import { CircleAlert, CircleCheck } from "lucide-react";

import type { AuthActionState } from "../model/action-state";
import { Input, Label } from "@/shared/ui";

type AuthFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  name: string;
  error?: string | undefined;
};

export function AuthField({
  label,
  name,
  error,
  id = name,
  ...props
}: AuthFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="h-10"
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthFormStatus({ state }: { state: AuthActionState }) {
  if (!state.message) {
    return null;
  }

  const isError = state.status === "error";
  const Icon = isError ? CircleAlert : CircleCheck;

  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
          : "flex gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-700 dark:text-emerald-400"
      }
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <p className="leading-5">{state.message}</p>
    </div>
  );
}
