"use client";

import { useActionState } from "react";

import { Button, Input, Label } from "@/shared/ui";

import { deleteWorkspaceAction } from "../api/actions";
import { initialWorkspaceActionState } from "../model/action-state";

type DeleteWorkspaceFormProps = {
  workspace: { id: string; name: string; slug: string };
};

export function DeleteWorkspaceForm({ workspace }: DeleteWorkspaceFormProps) {
  const [state, action, pending] = useActionState(
    deleteWorkspaceAction,
    initialWorkspaceActionState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="workspaceId" value={workspace.id} />
      <input type="hidden" name="workspaceSlug" value={workspace.slug} />
      <input type="hidden" name="workspaceName" value={workspace.name} />
      <div className="max-w-md space-y-2">
        <Label htmlFor="delete-workspace-confirmation">
          Type <strong>{workspace.name}</strong> to confirm
        </Label>
        <Input
          id="delete-workspace-confirmation"
          name="confirmation"
          autoComplete="off"
          defaultValue={state.values?.confirmation}
          aria-invalid={Boolean(state.fieldErrors?.confirmation)}
        />
        {state.fieldErrors?.confirmation?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.confirmation[0]}
          </p>
        ) : null}
      </div>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" variant="destructive" disabled={pending}>
        {pending ? "Deleting…" : "Delete workspace"}
      </Button>
    </form>
  );
}
