"use client";

import { useActionState } from "react";

import { Button, Input, Label } from "@/shared/ui";

import { renameWorkspaceAction } from "../api/actions";
import { initialWorkspaceActionState } from "../model/action-state";

type RenameWorkspaceFormProps = {
  workspace: { id: string; name: string; slug: string };
};

export function RenameWorkspaceForm({ workspace }: RenameWorkspaceFormProps) {
  const [state, action, pending] = useActionState(
    renameWorkspaceAction,
    initialWorkspaceActionState,
  );

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="workspaceId" value={workspace.id} />
      <input type="hidden" name="workspaceSlug" value={workspace.slug} />
      <div className="max-w-md space-y-2">
        <Label htmlFor="settings-workspace-name">Workspace name</Label>
        <Input
          id="settings-workspace-name"
          name="name"
          defaultValue={state.values?.name || workspace.name}
          aria-invalid={Boolean(state.fieldErrors?.name)}
        />
        {state.fieldErrors?.name?.[0] ? (
          <p className="text-xs text-destructive">
            {state.fieldErrors.name[0]}
          </p>
        ) : null}
      </div>
      {state.message ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
