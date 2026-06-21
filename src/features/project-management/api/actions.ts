"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import type { ProjectActionState } from "../model/action-state";
import {
  createProjectSchema,
  projectReferenceSchema,
  updateProjectSchema,
} from "../model/schemas";

function fieldError(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
  values: Record<string, string>,
): ProjectActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
    values,
  };
}

function mutationError(message?: string): ProjectActionState {
  return {
    status: "error",
    message: message || "We could not save this project change.",
  };
}

export async function createProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const result = createProjectSchema.safeParse(values);

  if (!result.success) return fieldError(result.error, values);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .rpc("create_project", {
      target_workspace_id: result.data.workspaceId,
      project_name: result.data.name,
      project_key: result.data.key,
      project_color: result.data.color,
      project_description: result.data.description,
    })
    .single();

  if (error || !data) return mutationError(error?.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(`/w/${result.data.workspaceSlug}/p/${data.project_id}/board`);
}

export async function updateProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const result = updateProjectSchema.safeParse(values);

  if (!result.success) return fieldError(result.error, values);

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .update({
      name: result.data.name,
      key: result.data.key,
      color: result.data.color,
      description: result.data.description || null,
    })
    .eq("workspace_id", result.data.workspaceId)
    .eq("id", result.data.projectId)
    .is("archived_at", null)
    .select("id")
    .single();

  if (error || !data) return mutationError(error?.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(
    `/w/${result.data.workspaceSlug}/projects?saved=${result.data.projectId}`,
  );
}

export async function setProjectArchivedAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const result = projectReferenceSchema.safeParse(values);

  if (!result.success) return fieldError(result.error, values);

  const shouldArchive = values.archived !== "true";
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("projects")
    .update({ archived_at: shouldArchive ? new Date().toISOString() : null })
    .eq("workspace_id", result.data.workspaceId)
    .eq("id", result.data.projectId)
    .select("id")
    .single();

  if (error || !data) return mutationError(error?.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(
    `/w/${result.data.workspaceSlug}/projects?${
      shouldArchive ? "archived=1&changed=archived" : "changed=restored"
    }`,
  );
}
