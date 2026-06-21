import { cache } from "react";

import type { Database } from "@/shared/api/supabase";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

export type WorkspaceMember = {
  id: string;
  displayName: string;
  email: string;
  role: Database["public"]["Enums"]["workspace_role"];
  joinedAt: string;
};

export const getWorkspaceMembers = cache(
  async (workspaceId: string): Promise<WorkspaceMember[]> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc("get_workspace_members", {
      target_workspace_id: workspaceId,
    });

    if (error) {
      return [];
    }

    return data.map((member) => ({
      id: member.user_id,
      displayName: member.display_name,
      email: member.email,
      role: member.member_role,
      joinedAt: member.joined_at,
    }));
  },
);
