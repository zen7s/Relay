import { cache } from "react";

import { createServerSupabaseClient } from "@/shared/api/supabase/server";
import type { Database } from "@/shared/api/supabase";

export type CurrentWorkspace = {
  id: string;
  name: string;
  slug: string;
  role: Database["public"]["Enums"]["workspace_role"];
};

export const getUserWorkspaces = cache(
  async (userId: string): Promise<CurrentWorkspace[]> => {
    const supabase = await createServerSupabaseClient();
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, joined_at")
      .eq("user_id", userId)
      .order("joined_at", { ascending: true });

    if (!memberships?.length) {
      return [];
    }

    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id, name, slug")
      .in(
        "id",
        memberships.map((membership) => membership.workspace_id),
      );

    const workspaceById = new Map(
      (workspaces ?? []).map((workspace) => [workspace.id, workspace]),
    );

    return memberships.flatMap((membership) => {
      const workspace = workspaceById.get(membership.workspace_id);

      return workspace ? [{ ...workspace, role: membership.role }] : [];
    });
  },
);

export const getPrimaryWorkspace = cache(
  async (userId: string): Promise<CurrentWorkspace | null> => {
    const workspaces = await getUserWorkspaces(userId);
    return workspaces[0] ?? null;
  },
);

export const getWorkspaceBySlug = cache(
  async (userId: string, slug: string): Promise<CurrentWorkspace | null> => {
    const workspaces = await getUserWorkspaces(userId);
    return workspaces.find((workspace) => workspace.slug === slug) ?? null;
  },
);
