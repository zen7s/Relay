"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminSupabaseClient } from "@/shared/api/supabase/admin";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import type { AccountSettingsActionState } from "../model/action-state";
import {
  changePasswordSchema,
  deleteAccountSchema,
  profileSchema,
} from "../model/schemas";

const avatarTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

function validationError(
  error: { flatten: () => { fieldErrors: Record<string, string[]> } },
  values: Record<string, string>,
): AccountSettingsActionState {
  return {
    status: "error",
    message: "Check the highlighted fields and try again.",
    fieldErrors: error.flatten().fieldErrors,
    values,
  };
}

function mutationError(message: string): AccountSettingsActionState {
  return { status: "error", message };
}

async function getAuthenticatedUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function updateProfileAction(
  _previousState: AccountSettingsActionState,
  formData: FormData,
): Promise<AccountSettingsActionState> {
  const values = { displayName: String(formData.get("displayName") ?? "") };
  const result = profileSchema.safeParse(values);
  if (!result.success) return validationError(result.error, values);

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return mutationError("Your session has expired. Sign in again.");

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: result.data.displayName })
    .eq("id", user.id);

  if (error) return mutationError("We could not update your profile.");

  revalidatePath("/", "layout");
  return { status: "success", message: "Profile updated." };
}

export async function updateAvatarAction(
  _previousState: AccountSettingsActionState,
  formData: FormData,
): Promise<AccountSettingsActionState> {
  const avatar = formData.get("avatar");
  if (!(avatar instanceof File) || avatar.size === 0) {
    return {
      ...mutationError("Choose an image to upload."),
      fieldErrors: { avatar: ["Choose an image to upload."] },
    };
  }

  if (avatar.size > 2 * 1024 * 1024) {
    return {
      ...mutationError("Avatar images must be 2 MB or smaller."),
      fieldErrors: { avatar: ["Use an image no larger than 2 MB."] },
    };
  }

  const extension = avatarTypes[avatar.type as keyof typeof avatarTypes];
  if (!extension) {
    return {
      ...mutationError("Use a JPEG, PNG, WebP, or AVIF image."),
      fieldErrors: { avatar: ["This image type is not supported."] },
    };
  }

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return mutationError("Your session has expired. Sign in again.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();
  const nextPath = `${user.id}/${randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(nextPath, avatar, { cacheControl: "3600", upsert: false });

  if (uploadError) return mutationError("We could not upload that avatar.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ avatar_path: nextPath })
    .eq("id", user.id);

  if (profileError) {
    await supabase.storage.from("avatars").remove([nextPath]);
    return mutationError("We could not save that avatar.");
  }

  if (profile?.avatar_path) {
    await supabase.storage.from("avatars").remove([profile.avatar_path]);
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Avatar updated." };
}

export async function removeAvatarAction(
  previousState: AccountSettingsActionState,
): Promise<AccountSettingsActionState> {
  void previousState;
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return mutationError("Your session has expired. Sign in again.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .single();

  if (!profile?.avatar_path) {
    return { status: "success", message: "Your avatar is already removed." };
  }

  const { error: storageError } = await supabase.storage
    .from("avatars")
    .remove([profile.avatar_path]);
  if (storageError) return mutationError("We could not remove your avatar.");

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: null })
    .eq("id", user.id);
  if (error) return mutationError("We could not update your profile.");

  revalidatePath("/", "layout");
  return { status: "success", message: "Avatar removed." };
}

export async function changePasswordAction(
  _previousState: AccountSettingsActionState,
  formData: FormData,
): Promise<AccountSettingsActionState> {
  const values = {
    currentPassword: String(formData.get("currentPassword") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };
  const result = changePasswordSchema.safeParse(values);
  if (!result.success) return validationError(result.error, {});

  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return mutationError("Your session has expired. Sign in again.");

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
    current_password: result.data.currentPassword,
  });

  if (error) {
    return mutationError(
      error.code === "invalid_credentials"
        ? "Your current password is incorrect."
        : error.message,
    );
  }

  return { status: "success", message: "Password updated." };
}

async function removeStorageObjects(
  bucket: "avatars" | "task-attachments",
  paths: string[],
) {
  if (!paths.length) return;
  const admin = createAdminSupabaseClient();

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await admin.storage
      .from(bucket)
      .remove(paths.slice(index, index + 100));
    if (error) throw error;
  }
}

export async function deleteAccountAction(
  _previousState: AccountSettingsActionState,
  formData: FormData,
): Promise<AccountSettingsActionState> {
  const values = { confirmation: String(formData.get("confirmation") ?? "") };
  const result = deleteAccountSchema.safeParse(values);
  if (!result.success) return validationError(result.error, values);

  const { supabase, user } = await getAuthenticatedUser();
  if (!user?.email)
    return mutationError("Your session has expired. Sign in again.");

  if (result.data.confirmation.toLowerCase() !== user.email.toLowerCase()) {
    return {
      ...mutationError("Enter your account email exactly to confirm deletion."),
      fieldErrors: { confirmation: ["Email does not match."] },
      values,
    };
  }

  const { data: blockers, error: blockerError } = await supabase.rpc(
    "get_account_deletion_blockers",
  );
  if (blockerError)
    return mutationError("We could not verify workspace ownership.");
  if (blockers.length) {
    return mutationError(
      "Transfer ownership or delete every workspace you own before deleting your account.",
    );
  }

  try {
    const admin = createAdminSupabaseClient();
    const [{ data: profile }, { data: attachments }] = await Promise.all([
      admin.from("profiles").select("avatar_path").eq("id", user.id).single(),
      admin
        .from("attachments")
        .select("storage_path")
        .eq("uploader_id", user.id),
    ]);

    await Promise.all([
      removeStorageObjects(
        "avatars",
        profile?.avatar_path ? [profile.avatar_path] : [],
      ),
      removeStorageObjects(
        "task-attachments",
        (attachments ?? []).map((attachment) => attachment.storage_path),
      ),
    ]);

    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) return mutationError(error.message);
  } catch (error) {
    return mutationError(
      error instanceof Error
        ? error.message
        : "We could not delete your account.",
    );
  }

  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/login?deleted=1");
}
