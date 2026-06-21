"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "lucide-react";

import type { ProjectBoardColumn } from "@/entities/project";
import type { ProjectLabel, Task } from "@/entities/task";
import type { WorkspaceMember } from "@/entities/workspace";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  NativeSelect,
  Textarea,
  type ButtonProps,
} from "@/shared/ui";

import { createTaskAction, updateTaskAction } from "../api/actions";
import { initialTaskActionState } from "../model/action-state";

const priorities = [
  { value: "no_priority", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

type TaskFormDialogProps = {
  context: { workspaceId: string; workspaceSlug: string; projectId: string };
  columns: ProjectBoardColumn[];
  labels: ProjectLabel[];
  members: WorkspaceMember[];
  task?: Task;
  defaultColumnId?: string | undefined;
  buttonLabel?: string;
  buttonVariant?: ButtonProps["variant"];
  buttonSize?: ButtonProps["size"];
  className?: string;
};

export function TaskFormDialog({
  context,
  columns,
  labels,
  members,
  task,
  defaultColumnId,
  buttonLabel,
  buttonVariant = task ? "ghost" : "default",
  buttonSize = task ? "icon-sm" : "default",
  className,
}: TaskFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(
    task ? updateTaskAction : createTaskAction,
    initialTaskActionState,
  );
  const editing = Boolean(task);
  const idPrefix = task?.id ?? `new-${defaultColumnId ?? "task"}`;
  const selectedLabelIds = new Set(state.labelIds ?? task?.labelIds ?? []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        onClick={() => setOpen(true)}
        aria-label={
          buttonLabel ?? (editing ? `Edit ${task?.title}` : undefined)
        }
      >
        {editing ? <Pencil /> : <Plus />}
        {buttonLabel ??
          (editing ? <span className="sr-only">Edit task</span> : "New task")}
      </Button>

      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit task" : "Create task"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update ownership, priority, due date, and labels."
              : "Add work to the board with enough context for the team."}
          </DialogDescription>
        </DialogHeader>

        <form action={action} className="space-y-4" noValidate>
          <input type="hidden" name="workspaceId" value={context.workspaceId} />
          <input
            type="hidden"
            name="workspaceSlug"
            value={context.workspaceSlug}
          />
          <input type="hidden" name="projectId" value={context.projectId} />
          {task ? <input type="hidden" name="taskId" value={task.id} /> : null}

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-title`}>Title</Label>
            <Input
              id={`${idPrefix}-title`}
              name="title"
              maxLength={240}
              defaultValue={state.values?.title ?? task?.title}
              placeholder="Prepare launch brief"
              aria-invalid={Boolean(state.fieldErrors?.title)}
              autoFocus
            />
            {state.fieldErrors?.title?.[0] ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.title[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-description`}>Description</Label>
            <Textarea
              id={`${idPrefix}-description`}
              name="description"
              maxLength={50000}
              defaultValue={
                state.values?.description ?? task?.description ?? ""
              }
              placeholder="Add context, constraints, or acceptance notes."
              className="min-h-28"
              aria-invalid={Boolean(state.fieldErrors?.description)}
            />
            {state.fieldErrors?.description?.[0] ? (
              <p className="text-xs text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {!editing ? (
              <div className="space-y-2">
                <Label htmlFor={`${idPrefix}-column`}>Status</Label>
                <NativeSelect
                  id={`${idPrefix}-column`}
                  name="columnId"
                  defaultValue={
                    state.values?.columnId ?? defaultColumnId ?? columns[0]?.id
                  }
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-priority`}>Priority</Label>
              <NativeSelect
                id={`${idPrefix}-priority`}
                name="priority"
                defaultValue={
                  state.values?.priority ?? task?.priority ?? "no_priority"
                }
              >
                {priorities.map((priority) => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-assignee`}>Assignee</Label>
              <NativeSelect
                id={`${idPrefix}-assignee`}
                name="assigneeId"
                defaultValue={
                  state.values?.assigneeId ?? task?.assignee_id ?? ""
                }
              >
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.displayName}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-due-date`}>Due date</Label>
              <Input
                id={`${idPrefix}-due-date`}
                name="dueDate"
                type="date"
                defaultValue={state.values?.dueDate ?? task?.due_date ?? ""}
                aria-invalid={Boolean(state.fieldErrors?.dueDate)}
              />
            </div>
          </div>

          {labels.length ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Labels</legend>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <label
                    key={label.id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border bg-background px-2.5 py-2 text-sm has-checked:border-primary/40 has-checked:bg-primary/5"
                  >
                    <input
                      type="checkbox"
                      name="labelIds"
                      value={label.id}
                      defaultChecked={selectedLabelIds.has(label.id)}
                      className="size-4 accent-primary"
                    />
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}

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
                  ? "Save task"
                  : "Create task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
