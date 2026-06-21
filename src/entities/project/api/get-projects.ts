import { cache } from "react";

import type { Database } from "@/shared/api/supabase";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
type BoardColumnRow = Database["public"]["Tables"]["board_columns"]["Row"];

export type Project = Pick<
  ProjectRow,
  | "id"
  | "workspace_id"
  | "name"
  | "key"
  | "color"
  | "description"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;

export type ProjectBoardColumn = Pick<
  BoardColumnRow,
  "id" | "name" | "position"
>;

export type ProjectBoard = {
  project: Project;
  columns: ProjectBoardColumn[];
};

const projectSelection =
  "id, workspace_id, name, key, color, description, archived_at, created_at, updated_at";

export const getWorkspaceProjects = cache(
  async (workspaceId: string): Promise<Project[]> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("projects")
      .select(projectSelection)
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    return error ? [] : data;
  },
);

export const getProjectBoard = cache(
  async (
    workspaceId: string,
    projectId: string,
  ): Promise<ProjectBoard | null> => {
    const supabase = await createServerSupabaseClient();
    const [{ data: project, error: projectError }, { data: columns }] =
      await Promise.all([
        supabase
          .from("projects")
          .select(projectSelection)
          .eq("workspace_id", workspaceId)
          .eq("id", projectId)
          .maybeSingle(),
        supabase
          .from("board_columns")
          .select("id, name, position")
          .eq("workspace_id", workspaceId)
          .eq("project_id", projectId)
          .order("position", { ascending: true }),
      ]);

    if (projectError || !project) return null;

    return { project, columns: columns ?? [] };
  },
);
