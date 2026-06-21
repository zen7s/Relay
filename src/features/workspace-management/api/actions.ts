"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import type { WorkspaceActionState } from "../model/action-state";
import {
  deleteWorkspaceSchema,
  memberMutationSchema,
  renameWorkspaceSchema,
  transferOwnershipSchema,
  updateMemberRoleSchema,
  workspaceNameSchema,
  workspaceReferenceSchema,
} from "../model/schemas";

function fieldError(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
  values: Record<string, string>,
): WorkspaceActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
    values,
  };
}

function mutationError(message?: string): WorkspaceActionState {
  return {
    status: "error",
    message: message || "We could not save this workspace change.",
  };
}

async function getNextWorkspaceSlug(excludedWorkspaceId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .neq("workspace_id", excludedWorkspaceId)
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) return null;

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", membership.workspace_id)
    .maybeSingle();

  return workspace?.slug ?? null;
}

export async function createWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const name = formData.get("name");
  const result = workspaceNameSchema.safeParse({ name });

  if (!result.success) {
    return fieldError(result.error, {
      name: typeof name === "string" ? name : "",
    });
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .rpc("create_workspace", { requested_name: result.data.name })
    .single();

  if (error || !data) {
    return mutationError(error?.message);
  }

  revalidatePath("/", "layout");
  redirect(`/w/${data.workspace_slug}`);
}

export async function renameWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const values = {
    workspaceId: String(formData.get("workspaceId") ?? ""),
    workspaceSlug: String(formData.get("workspaceSlug") ?? ""),
    name: String(formData.get("name") ?? ""),
  };
  const result = renameWorkspaceSchema.safeParse(values);

  if (!result.success) return fieldError(result.error, values);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("workspaces")
    .update({ name: result.data.name })
    .eq("id", result.data.workspaceId);

  if (error) return mutationError(error.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(`/w/${result.data.workspaceSlug}/settings?saved=workspace`);
}

export async function deleteWorkspaceAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const values = {
    workspaceId: String(formData.get("workspaceId") ?? ""),
    workspaceSlug: String(formData.get("workspaceSlug") ?? ""),
    workspaceName: String(formData.get("workspaceName") ?? ""),
    confirmation: String(formData.get("confirmation") ?? ""),
  };
  const result = deleteWorkspaceSchema.safeParse(values);

  if (!result.success) return fieldError(result.error, values);

  if (result.data.confirmation !== result.data.workspaceName) {
    return {
      ...mutationError("Enter the workspace name exactly to confirm deletion."),
      fieldErrors: { confirmation: ["Workspace name does not match."] },
      values,
    };
  }

  const nextSlug = await getNextWorkspaceSlug(result.data.workspaceId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("workspaces")
    .delete()
    .eq("id", result.data.workspaceId);

  if (error) return mutationError(error.message);

  revalidatePath("/", "layout");
  redirect(nextSlug ? `/w/${nextSlug}` : "/onboarding");
}

export async function updateMemberRoleAction(formData: FormData) {
  const result = updateMemberRoleSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase.rpc("update_workspace_member_role", {
    target_workspace_id: result.data.workspaceId,
    target_user_id: result.data.userId,
    requested_role: result.data.role,
  });
  revalidatePath(`/w/${result.data.workspaceSlug}/members`);
}

export async function removeMemberAction(formData: FormData) {
  const result = memberMutationSchema.safeParse(Object.fromEntries(formData));
  if (!result.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase.rpc("remove_workspace_member", {
    target_workspace_id: result.data.workspaceId,
    target_user_id: result.data.userId,
  });
  revalidatePath(`/w/${result.data.workspaceSlug}/members`);
}

export async function transferOwnershipAction(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const result = transferOwnershipSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!result.success) return fieldError(result.error, {});

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("transfer_workspace_ownership", {
    target_workspace_id: result.data.workspaceId,
    target_user_id: result.data.userId,
  });

  if (error) return mutationError(error.message);

  revalidatePath(`/w/${result.data.workspaceSlug}`, "layout");
  redirect(`/w/${result.data.workspaceSlug}/members?transferred=1`);
}

export async function leaveWorkspaceAction(formData: FormData) {
  const result = workspaceReferenceSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!result.success) return;

  const nextSlug = await getNextWorkspaceSlug(result.data.workspaceId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc("leave_workspace", {
    target_workspace_id: result.data.workspaceId,
  });

  if (error) redirect(`/w/${result.data.workspaceSlug}/settings?leave=owner`);

  revalidatePath("/", "layout");
  redirect(nextSlug ? `/w/${nextSlug}` : "/onboarding");
}
