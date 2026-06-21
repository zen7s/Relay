"use server";

import { createHash, randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/entities/user";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

import { sendWorkspaceInvitationEmail } from "../lib/send-invitation-email";
import type { InvitationActionState } from "../model/action-state";
import {
  invitationReferenceSchema,
  invitationTokenSchema,
  inviteMemberSchema,
} from "../model/schemas";

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;

function createToken() {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + invitationLifetimeMs).toISOString();
  return { token, tokenHash, expiresAt };
}

function inviteError(message?: string): InvitationActionState {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("already a workspace member")) {
    return { status: "error", message: "This person is already a member." };
  }

  if (normalized.includes("already pending")) {
    return { status: "error", message: "An invitation is already pending." };
  }

  return {
    status: "error",
    message: "We could not send this invitation. Please try again.",
  };
}

async function getInvitationEmailContext(workspaceId: string) {
  const [user, supabase] = await Promise.all([
    getCurrentUser(),
    createServerSupabaseClient(),
  ]);
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .maybeSingle();

  if (!user || !workspace) return null;

  return { workspaceName: workspace.name, inviterName: user.displayName };
}

export async function inviteMemberAction(
  _previousState: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const values = {
    workspaceId: String(formData.get("workspaceId") ?? ""),
    workspaceSlug: String(formData.get("workspaceSlug") ?? ""),
    email: String(formData.get("email") ?? ""),
    role: String(formData.get("role") ?? ""),
  };
  const result = inviteMemberSchema.safeParse(values);

  if (!result.success) {
    return {
      status: "error",
      message: "Check the invitation details and try again.",
      fieldErrors: result.error.flatten().fieldErrors,
      values,
    };
  }

  const context = await getInvitationEmailContext(result.data.workspaceId);
  if (!context) return inviteError();

  const { token, tokenHash, expiresAt } = createToken();
  const supabase = await createServerSupabaseClient();
  const { data: invitationId, error } = await supabase.rpc(
    "create_workspace_invitation",
    {
      target_workspace_id: result.data.workspaceId,
      invited_email: result.data.email,
      invited_role: result.data.role,
      invitation_token_hash: tokenHash,
      invitation_expires_at: expiresAt,
    },
  );

  if (error || !invitationId) return inviteError(error?.message);

  try {
    await sendWorkspaceInvitationEmail({
      to: result.data.email,
      workspaceName: context.workspaceName,
      inviterName: context.inviterName,
      token,
    });
  } catch {
    await supabase.rpc("revoke_workspace_invitation", {
      target_invitation_id: invitationId,
    });
    return inviteError();
  }

  revalidatePath(`/w/${result.data.workspaceSlug}/members`);
  return {
    status: "success",
    message: `Invitation sent to ${result.data.email}.`,
  };
}

export async function resendInvitationAction(formData: FormData) {
  const result = invitationReferenceSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!result.success) return;

  const context = await getInvitationEmailContext(result.data.workspaceId);
  const supabase = await createServerSupabaseClient();
  const { data: invitation } = await supabase
    .from("workspace_invitations")
    .select("email")
    .eq("id", result.data.invitationId)
    .maybeSingle();

  if (!context || !invitation) return;

  const { token, tokenHash, expiresAt } = createToken();
  const { error } = await supabase.rpc("resend_workspace_invitation", {
    target_invitation_id: result.data.invitationId,
    invitation_token_hash: tokenHash,
    invitation_expires_at: expiresAt,
  });

  if (error) return;

  await sendWorkspaceInvitationEmail({
    to: invitation.email,
    workspaceName: context.workspaceName,
    inviterName: context.inviterName,
    token,
  });
  revalidatePath(`/w/${result.data.workspaceSlug}/members`);
}

export async function revokeInvitationAction(formData: FormData) {
  const result = invitationReferenceSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!result.success) return;

  const supabase = await createServerSupabaseClient();
  await supabase.rpc("revoke_workspace_invitation", {
    target_invitation_id: result.data.invitationId,
  });
  revalidatePath(`/w/${result.data.workspaceSlug}/members`);
}

export async function acceptInvitationAction(formData: FormData) {
  const tokenResult = invitationTokenSchema.safeParse(formData.get("token"));
  if (!tokenResult.success) redirect("/login");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .rpc("accept_workspace_invitation", {
      invitation_token: tokenResult.data,
    })
    .single();

  if (error || !data) {
    const invitePath = `/invite/${encodeURIComponent(tokenResult.data)}`;
    redirect(`${invitePath}?error=account`);
  }

  revalidatePath("/", "layout");
  redirect(`/w/${data.workspace_slug}`);
}
