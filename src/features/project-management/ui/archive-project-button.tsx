"use client";

import { useActionState, useState } from "react";
import { Archive, ArchiveRestore } from "lucide-react";

import type { Project } from "@/entities/project";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";

import { setProjectArchivedAction } from "../api/actions";
import { initialProjectActionState } from "../model/action-state";

type ArchiveProjectButtonProps = {
  workspace: { id: string; slug: string };
  project: Project;
};

export function ArchiveProjectButton({
  workspace,
  project,
}: ArchiveProjectButtonProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    setProjectArchivedAction,
    initialProjectActionState,
  );
  const archived = Boolean(project.archived_at);
  const Icon = archived ? ArchiveRestore : Archive;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Icon />
        {archived ? "Restore" : "Archive"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {archived ? "Restore project?" : "Archive project?"}
          </DialogTitle>
          <DialogDescription>
            {archived
              ? `${project.name} will return to the active project list.`
              : `${project.name} and its board will become read-only until restored.`}
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <input type="hidden" name="workspaceSlug" value={workspace.slug} />
          <input type="hidden" name="projectId" value={project.id} />
          <input type="hidden" name="archived" value={String(archived)} />
          {state.message ? (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant={archived ? "default" : "destructive"}
              disabled={pending}
            >
              {pending
                ? archived
                  ? "Restoring…"
                  : "Archiving…"
                : archived
                  ? "Restore project"
                  : "Archive project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
