"use client";

import { useActionState, useState } from "react";
import { Tags, Trash2 } from "lucide-react";

import type { ProjectLabel } from "@/entities/task";
import { cn } from "@/shared/lib";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/shared/ui";

import { createLabelAction, deleteLabelAction } from "../api/actions";
import { initialTaskActionState } from "../model/action-state";

const labelColors = [
  { label: "Indigo", value: "#6366F1" },
  { label: "Sky", value: "#0EA5E9" },
  { label: "Emerald", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Rose", value: "#F43F5E" },
  { label: "Fuchsia", value: "#D946EF" },
];

type ProjectLabelsDialogProps = {
  context: { workspaceId: string; workspaceSlug: string; projectId: string };
  labels: ProjectLabel[];
};

export function ProjectLabelsDialog({
  context,
  labels,
}: ProjectLabelsDialogProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState("#6366F1");
  const [state, action, pending] = useActionState(
    createLabelAction,
    initialTaskActionState,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="outline" onClick={() => setOpen(true)}>
        <Tags />
        Labels
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Project labels</DialogTitle>
          <DialogDescription>
            Create a compact vocabulary for filtering and scanning tasks.
          </DialogDescription>
        </DialogHeader>

        {labels.length ? (
          <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: label.color }}
                  />
                  <span className="truncate">{label.name}</span>
                </span>
                <form action={deleteLabelAction}>
                  <input
                    type="hidden"
                    name="workspaceId"
                    value={context.workspaceId}
                  />
                  <input
                    type="hidden"
                    name="workspaceSlug"
                    value={context.workspaceSlug}
                  />
                  <input
                    type="hidden"
                    name="projectId"
                    value={context.projectId}
                  />
                  <input type="hidden" name="labelId" value={label.id} />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${label.name}`}
                  >
                    <Trash2 />
                  </Button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            No labels yet.
          </p>
        )}

        <form action={action} className="space-y-4 border-t pt-4" noValidate>
          <input type="hidden" name="workspaceId" value={context.workspaceId} />
          <input
            type="hidden"
            name="workspaceSlug"
            value={context.workspaceSlug}
          />
          <input type="hidden" name="projectId" value={context.projectId} />
          <input type="hidden" name="color" value={color} />
          <div className="space-y-2">
            <Label htmlFor="new-label-name">New label</Label>
            <Input
              id="new-label-name"
              name="name"
              maxLength={50}
              placeholder="Feature"
              defaultValue={state.values?.name}
              aria-invalid={Boolean(state.fieldErrors?.name)}
            />
            {state.fieldErrors?.name?.[0] ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            ) : null}
          </div>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Label color"
          >
            {labelColors.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-label={option.label}
                aria-pressed={color === option.value}
                onClick={() => setColor(option.value)}
                className={cn(
                  "size-8 rounded-full border-2 border-background shadow-sm ring-offset-2 ring-offset-background outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  color === option.value && "ring-2 ring-foreground/40",
                )}
                style={{ backgroundColor: option.value }}
              />
            ))}
          </div>
          {state.message ? (
            <p
              role={state.status === "success" ? "status" : "alert"}
              className={cn(
                "text-sm",
                state.status === "success"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : "text-destructive",
              )}
            >
              {state.message}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create label"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
