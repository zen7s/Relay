import { cache } from "react";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";
import type { Database } from "@/shared/api/supabase";

export type CurrentWorkspace = {
  id: string;
  name: string;
  slug: string;
  role: Database["public"]["Enums"]["workspace_role"];
};

export const getPrimaryWorkspace = cache(
  async (userId: string): Promise<CurrentWorkspace | null> => {
    const supabase = await createServerSupabaseClient();
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return null;
    }

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .eq("id", membership.workspace_id)
      .maybeSingle();

    if (!workspace) {
      return null;
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      role: membership.role,
    };
  },
);
