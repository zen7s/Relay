"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  prepareTaskMove,
  type PreparedTaskMove,
  type Task,
} from "@/entities/task/client";
import type { Database } from "@/shared/api/supabase";
import { createBrowserSupabaseClient } from "@/shared/api/supabase/browser";

type MoveTaskArgs = Database["public"]["Functions"]["move_task"]["Args"];

type UseLiveProjectTasksOptions = {
  workspaceId: string;
  projectId: string;
  initialTasks: Task[];
};

export type TaskMoveRequest = {
  taskId: string;
  targetColumnId: string;
  targetIndex: number;
};

export type RealtimeStatus = "connecting" | "live" | "offline";

const taskSelection =
  "id, workspace_id, project_id, column_id, title, description, assignee_id, priority, due_date, position, archived_at, created_at, updated_at, task_labels(label_id)";

export function useLiveProjectTasks({
  workspaceId,
  projectId,
  initialTasks,
}: UseLiveProjectTasksOptions) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const queryKey = useMemo(
    () => ["project-tasks", workspaceId, projectId] as const,
    [workspaceId, projectId],
  );
  const [realtimeStatus, setRealtimeStatus] =
    useState<RealtimeStatus>("connecting");
  const [connectionGeneration, setConnectionGeneration] = useState(0);

  const tasksQuery = useQuery({
    queryKey,
    initialData: initialTasks,
    queryFn: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from("tasks")
        .select(taskSelection)
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId)
        .order("position", { ascending: true });

      if (error) throw error;

      return data.map(({ task_labels: taskLabels, ...task }) => ({
        ...task,
        labelIds: taskLabels.map((taskLabel) => taskLabel.label_id),
      }));
    },
  });

  useEffect(() => {
    queryClient.setQueryData<Task[]>(queryKey, initialTasks);
  }, [initialTasks, queryClient, queryKey]);

  useEffect(() => {
    let reconciliationTimeout: ReturnType<typeof setTimeout> | undefined;
    const handleOffline = () => setRealtimeStatus("offline");
    const handleOnline = () => {
      setRealtimeStatus("connecting");
      setConnectionGeneration((generation) => generation + 1);
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const channel = supabase
      .channel(`project-tasks:${projectId}:${connectionGeneration}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
          void queryClient.invalidateQueries({ queryKey });
          clearTimeout(reconciliationTimeout);
          reconciliationTimeout = setTimeout(() => {
            void queryClient.invalidateQueries({ queryKey });
          }, 5_000);
          return;
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("offline");
          return;
        }
        if (status === "CLOSED") setRealtimeStatus("offline");
      });

    return () => {
      clearTimeout(reconciliationTimeout);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      void supabase.removeChannel(channel);
    };
  }, [connectionGeneration, projectId, queryClient, queryKey, supabase]);

  const moveMutation = useMutation({
    mutationFn: async (move: PreparedTaskMove) => {
      const args: MoveTaskArgs = {
        target_task_id: move.taskId,
        target_column_id: move.targetColumnId,
      };
      if (move.previousTaskId) args.previous_task_id = move.previousTaskId;
      if (move.nextTaskId) args.next_task_id = move.nextTaskId;

      const { error } = await supabase.rpc("move_task", args);
      if (error) throw error;
    },
    onMutate: async (move) => {
      await queryClient.cancelQueries({ queryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];
      queryClient.setQueryData<Task[]>(queryKey, move.tasks);
      return { previousTasks };
    },
    onError: (_error, _move, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData<Task[]>(queryKey, context.previousTasks);
      }
      toast.error("Task move failed", {
        description: "The board was restored to the server order.",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const moveTask = useCallback(
    (request: TaskMoveRequest) => {
      const currentTasks = queryClient.getQueryData<Task[]>(queryKey) ?? [];
      const move = prepareTaskMove(
        currentTasks,
        request.taskId,
        request.targetColumnId,
        request.targetIndex,
      );
      if (move) moveMutation.mutate(move);
    },
    [moveMutation, queryClient, queryKey],
  );

  return {
    tasks: tasksQuery.data,
    moveTask,
    movingTaskId: moveMutation.variables?.taskId,
    isMoving: moveMutation.isPending,
    realtimeStatus,
  };
}
