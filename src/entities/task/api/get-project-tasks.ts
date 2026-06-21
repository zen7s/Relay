import { cache } from "react";

import type { Database } from "@/shared/api/supabase";
import { createServerSupabaseClient } from "@/shared/api/supabase/server";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
type LabelRow = Database["public"]["Tables"]["labels"]["Row"];

export type TaskPriority = Database["public"]["Enums"]["task_priority"];

export type Task = Pick<
  TaskRow,
  | "id"
  | "workspace_id"
  | "project_id"
  | "column_id"
  | "title"
  | "description"
  | "assignee_id"
  | "priority"
  | "due_date"
  | "position"
  | "archived_at"
  | "created_at"
  | "updated_at"
> & {
  labelIds: string[];
};

export type ProjectLabel = Pick<
  LabelRow,
  "id" | "workspace_id" | "project_id" | "name" | "color"
>;

export type WorkspaceTaskStats = {
  open: number;
  completed: number;
  urgent: number;
  dueSoon: number;
};

export const getProjectTasks = cache(
  async (workspaceId: string, projectId: string): Promise<Task[]> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("tasks")
      .select(
        "id, workspace_id, project_id, column_id, title, description, assignee_id, priority, due_date, position, archived_at, created_at, updated_at, task_labels(label_id)",
      )
      .eq("workspace_id", workspaceId)
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) return [];

    return data.map(({ task_labels: taskLabels, ...task }) => ({
      ...task,
      labelIds: taskLabels.map((taskLabel) => taskLabel.label_id),
    }));
  },
);

export const getProjectLabels = cache(
  async (workspaceId: string, projectId: string): Promise<ProjectLabel[]> => {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("labels")
      .select("id, workspace_id, project_id, name, color")
      .eq("workspace_id", workspaceId)
      .eq("project_id", projectId)
      .order("name", { ascending: true });

    return error ? [] : data;
  },
);

export const getWorkspaceTaskStats = cache(
  async (workspaceId: string): Promise<WorkspaceTaskStats> => {
    const supabase = await createServerSupabaseClient();
    const [{ data: tasks }, { data: columns }, { data: projects }] =
      await Promise.all([
        supabase
          .from("tasks")
          .select("project_id, column_id, priority, due_date")
          .eq("workspace_id", workspaceId)
          .is("archived_at", null),
        supabase
          .from("board_columns")
          .select("id, name")
          .eq("workspace_id", workspaceId),
        supabase
          .from("projects")
          .select("id")
          .eq("workspace_id", workspaceId)
          .is("archived_at", null),
      ]);

    const activeProjectIds = new Set(
      (projects ?? []).map((project) => project.id),
    );
    const doneColumnIds = new Set(
      (columns ?? [])
        .filter((column) => column.name.toLowerCase() === "done")
        .map((column) => column.id),
    );
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 7);

    return (tasks ?? []).reduce<WorkspaceTaskStats>(
      (stats, task) => {
        if (!activeProjectIds.has(task.project_id)) return stats;

        const completed = doneColumnIds.has(task.column_id);
        if (completed) stats.completed += 1;
        else stats.open += 1;
        if (!completed && task.priority === "urgent") stats.urgent += 1;
        if (
          !completed &&
          task.due_date &&
          new Date(`${task.due_date}T23:59:59`) <= soon
        ) {
          stats.dueSoon += 1;
        }
        return stats;
      },
      { open: 0, completed: 0, urgent: 0, dueSoon: 0 },
    );
  },
);
