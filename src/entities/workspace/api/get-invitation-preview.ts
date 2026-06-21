import { cache } from "react";

import type { Database } from "@/shared/api/supabase";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

export type InvitationPreview = {
  workspaceName: string;
  workspaceSlug: string;
  emailHint: string;
  role: Database["public"]["Enums"]["workspace_role"];
  status: string;
  expiresAt: string;
};

export const getInvitationPreview = cache(
  async (token: string): Promise<InvitationPreview | null> => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .rpc("get_workspace_invitation", { invitation_token: token })
      .maybeSingle();

    return data
      ? {
          workspaceName: data.workspace_name,
          workspaceSlug: data.workspace_slug,
          emailHint: data.email_hint,
          role: data.invitation_role,
          status: data.invitation_status,
          expiresAt: data.invitation_expires_at,
        }
      : null;
  },
);
