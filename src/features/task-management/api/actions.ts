"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { Database } from "@/shared/api/supabase";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import type { TaskActionState } from "../model/action-state";
import {
  archiveTaskSchema,
  createLabelSchema,
  createTaskSchema,
  deleteLabelSchema,
  moveTaskSchema,
  updateTaskSchema,
} from "../model/schemas";

type CreateTaskArgs = Database["public"]["Functions"]["create_task"]["Args"];
type UpdateTaskArgs = Database["public"]["Functions"]["update_task"]["Args"];

function taskFormValues(formData: FormData) {
  const values = Object.fromEntries(formData) as Record<string, string>;
  return {
    values,
    input: {
      ...values,
      labelIds: formData.getAll("labelIds").map(String),
    },
  };
}

function fieldError(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
  values: Record<string, string>,
  labelIds: string[] = [],
): TaskActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
    values,
    labelIds,
  };
}

function mutationError(message?: string): TaskActionState {
  return {
    status: "error",
    message: message || "We could not save this task change.",
  };
}

export async function createTaskAction(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const { values, input } = taskFormValues(formData);
  const result = createTaskSchema.safeParse(input);

  if (!result.success) {
    return fieldError(result.error, values, input.labelIds);
  }

  const args: CreateTaskArgs = {
    target_workspace_id: result.data.workspaceId,
    target_project_id: result.data.projectId,
    target_column_id: result.data.columnId,
    task_title: result.data.title,
    task_description: result.data.description,
    task_priority: result.data.priority,
    task_label_ids: result.data.labelIds,
  };
  if (result.data.assigneeId) args.task_assignee_id = result.data.assigneeId;
  if (result.data.dueDate) args.task_due_date = result.data.dueDate;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc("create_task", args);

  if (error || !data) return mutationError(error?.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(
    `/w/${result.data.workspaceSlug}/p/${result.data.projectId}/board?created=${data}`,
  );
}

export async function updateTaskAction(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const { values, input } = taskFormValues(formData);
  const result = updateTaskSchema.safeParse(input);

  if (!result.success) {
    return fieldError(result.error, values, input.labelIds);
  }

  const args: UpdateTaskArgs = {
    target_task_id: result.data.taskId,
    task_title: result.data.title,
    task_description: result.data.description,
    task_priority: result.data.priority,
    task_label_ids: result.data.labelIds,
  };
  if (result.data.assigneeId) args.task_assignee_id = result.data.assigneeId;
  if (result.data.dueDate) args.task_due_date = result.data.dueDate;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("update_task", args);

  if (error) return mutationError(error.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(
    `/w/${result.data.workspaceSlug}/p/${result.data.projectId}/board?saved=${result.data.taskId}`,
  );
}

export async function moveTaskAction(formData: FormData) {
  const result = moveTaskSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("move_task", {
    target_task_id: result.data.taskId,
    target_column_id: result.data.columnId,
  });

  if (!error) {
    revalidatePath(
      `/w/${result.data.workspaceSlug}/p/${result.data.projectId}/board`,
    );
  }
}

export async function setTaskArchivedAction(formData: FormData) {
  const result = archiveTaskSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("set_task_archived", {
    target_task_id: result.data.taskId,
    should_archive: result.data.archived,
  });
  if (error) return;

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(
    `/w/${result.data.workspaceSlug}/p/${result.data.projectId}/board?${
      result.data.archived ? "archived=1&changed=archived" : "changed=restored"
    }`,
  );
}

export async function createLabelAction(
  _previousState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const result = createLabelSchema.safeParse(values);

  if (!result.success) return fieldError(result.error, values);

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return mutationError("Sign in again to manage labels.");

  const { error } = await supabase.from("labels").insert({
    workspace_id: result.data.workspaceId,
    project_id: result.data.projectId,
    name: result.data.name,
    color: result.data.color,
    created_by: user.id,
  });

  if (error) return mutationError(error.message);

  revalidatePath(
    `/w/${result.data.workspaceSlug}/p/${result.data.projectId}/board`,
  );
  return { status: "success", message: "Label created." };
}

export async function deleteLabelAction(formData: FormData) {
  const result = deleteLabelSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return;

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("labels")
    .delete()
    .eq("id", result.data.labelId)
    .eq("workspace_id", result.data.workspaceId)
    .eq("project_id", result.data.projectId);

  if (!error) {
    revalidatePath(
      `/w/${result.data.workspaceSlug}/p/${result.data.projectId}/board`,
    );
  }
}
