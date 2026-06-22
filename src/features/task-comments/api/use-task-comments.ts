"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskComment } from "@/entities/comment/client";
import { createBrowserSupabaseClient } from "@/shared/api/supabase/browser";

import { commentBodySchema } from "../model/schemas";

type UseTaskCommentsOptions = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  currentUserId: string;
  initialComments: TaskComment[];
};

type CommentMutation = {
  id: string;
  body: string;
};

const commentSelection =
  "id, workspace_id, project_id, task_id, author_id, body, edited_at, created_at, updated_at, author:profiles!comments_author_id_fkey(display_name, avatar_path)";

export type CommentsRealtimeStatus = "connecting" | "live" | "offline";

export function useTaskComments({
  workspaceId,
  projectId,
  taskId,
  currentUserId,
  initialComments,
}: UseTaskCommentsOptions) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const queryKey = useMemo(
    () => ["task-comments", workspaceId, projectId, taskId] as const,
    [workspaceId, projectId, taskId],
  );
  const [realtimeStatus, setRealtimeStatus] =
    useState<CommentsRealtimeStatus>("connecting");
  const [connectionGeneration, setConnectionGeneration] = useState(0);

  const commentsQuery = useQuery({
    queryKey,
    initialData: initialComments,
    queryFn: async (): Promise<TaskComment[]> => {
      const { data, error } = await supabase
        .from("comments")
        .select(commentSelection)
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId)
        .eq("task_id", taskId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map(({ author, ...comment }) => ({
        ...comment,
        author: {
          displayName: author.display_name,
          avatarPath: author.avatar_path,
        },
      }));
    },
  });

  useEffect(() => {
    queryClient.setQueryData<TaskComment[]>(queryKey, initialComments);
  }, [initialComments, queryClient, queryKey]);

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
      .channel(`task-comments:${taskId}:${connectionGeneration}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
          filter: `task_id=eq.${taskId}`,
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
        if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeStatus("offline");
        }
      });

    return () => {
      clearTimeout(reconciliationTimeout);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      void supabase.removeChannel(channel);
    };
  }, [connectionGeneration, queryClient, queryKey, supabase, taskId]);

  const addMutation = useMutation({
    mutationFn: async (body: string) => {
      const parsedBody = commentBodySchema.parse(body);
      const { error } = await supabase.from("comments").insert({
        workspace_id: workspaceId,
        project_id: projectId,
        task_id: taskId,
        author_id: currentUserId,
        body: parsedBody,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Comment could not be posted."),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, body }: CommentMutation) => {
      const parsedBody = commentBodySchema.parse(body);
      const { error } = await supabase
        .from("comments")
        .update({ body: parsedBody, edited_at: new Date().toISOString() })
        .eq("id", id)
        .eq("task_id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Comment changes could not be saved."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("comments")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .eq("task_id", taskId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
    onError: () => toast.error("Comment could not be deleted."),
  });

  return {
    comments: commentsQuery.data,
    isLoading: commentsQuery.isLoading,
    error: commentsQuery.error,
    realtimeStatus,
    addComment: addMutation.mutateAsync,
    editComment: editMutation.mutateAsync,
    deleteComment: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    editingCommentId: editMutation.variables?.id,
    deletingCommentId: deleteMutation.variables,
  };
}
