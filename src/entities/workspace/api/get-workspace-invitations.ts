import { cache } from "react";

import type { Database } from "@/shared/api/supabase";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

export type WorkspaceInvitation = {
  id: string;
  email: string;
  role: Database["public"]["Enums"]["workspace_role"];
  expiresAt: string;
  createdAt: string;
};

export const getWorkspaceInvitations = cache(
  async (workspaceId: string): Promise<WorkspaceInvitation[]> => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("workspace_invitations")
      .select("id, email, role, expires_at, created_at")
      .eq("workspace_id", workspaceId)
      .is("accepted_at", null)
      .is("revoked_at", null)
      .order("created_at", { ascending: false });

    return (data ?? []).map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expires_at,
      createdAt: invitation.created_at,
    }));
  },
);
