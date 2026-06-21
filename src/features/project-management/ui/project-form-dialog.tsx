"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import type { Project } from "@/entities/project";
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
  Textarea,
  type ButtonProps,
} from "@/shared/ui";

import { createProjectAction, updateProjectAction } from "../api/actions";
import { initialProjectActionState } from "../model/action-state";

const projectColors = [
  { label: "Indigo", value: "#6366F1" },
  { label: "Sky", value: "#0EA5E9" },
  { label: "Emerald", value: "#10B981" },
  { label: "Amber", value: "#F59E0B" },
  { label: "Rose", value: "#F43F5E" },
  { label: "Fuchsia", value: "#D946EF" },
];
const defaultProjectColor = "#6366F1";

type ProjectFormDialogProps = {
  workspace: { id: string; slug: string };
  project?: Project;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  className?: string;
};

export function ProjectFormDialog({
  workspace,
  project,
  buttonVariant = project ? "ghost" : "default",
  buttonSize = project ? "sm" : "default",
  className,
}: ProjectFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [color, setColor] = useState(project?.color ?? defaultProjectColor);
  const [state, action, pending] = useActionState(
    project ? updateProjectAction : createProjectAction,
    initialProjectActionState,
  );
  const editing = Boolean(project);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        onClick={() => setOpen(true)}
      >
        {editing ? <Pencil /> : <Plus />}
        {editing ? "Edit" : "New project"}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit project" : "Create project"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the project details. Existing tasks and columns are preserved."
              : "A ready-to-use board with five workflow columns will be created automatically."}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="workspaceId" value={workspace.id} />
          <input type="hidden" name="workspaceSlug" value={workspace.slug} />
          {project ? (
            <input type="hidden" name="projectId" value={project.id} />
          ) : null}
          <input type="hidden" name="color" value={color} />

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
            <div className="space-y-2">
              <Label htmlFor={`${project?.id ?? "new"}-project-name`}>
                Project name
              </Label>
              <Input
                id={`${project?.id ?? "new"}-project-name`}
                name="name"
                maxLength={100}
                defaultValue={state.values?.name ?? project?.name}
                placeholder="Product launch"
                aria-invalid={Boolean(state.fieldErrors?.name)}
                autoFocus
              />
              {state.fieldErrors?.name?.[0] ? (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${project?.id ?? "new"}-project-key`}>Key</Label>
              <Input
                id={`${project?.id ?? "new"}-project-key`}
                name="key"
                maxLength={10}
                defaultValue={state.values?.key ?? project?.key}
                placeholder="LAUNCH"
                className="uppercase"
                aria-invalid={Boolean(state.fieldErrors?.key)}
              />
              {state.fieldErrors?.key?.[0] ? (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.key[0]}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Project color</Label>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Project color"
            >
              {projectColors.map((option) => (
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
            {state.fieldErrors?.color?.[0] ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.color[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${project?.id ?? "new"}-project-description`}>
              Description{" "}
              <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id={`${project?.id ?? "new"}-project-description`}
              name="description"
              maxLength={2000}
              defaultValue={
                state.values?.description ?? project?.description ?? ""
              }
              placeholder="What is this project aiming to accomplish?"
              aria-invalid={Boolean(state.fieldErrors?.description)}
            />
            {state.fieldErrors?.description?.[0] ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            ) : null}
          </div>

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
            <Button type="submit" disabled={pending}>
              {pending
                ? editing
                  ? "Saving…"
                  : "Creating…"
                : editing
                  ? "Save project"
                  : "Create project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
