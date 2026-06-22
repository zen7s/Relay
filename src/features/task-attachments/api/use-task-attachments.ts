"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload } from "tus-js-client";

import {
  TASK_ATTACHMENTS_BUCKET,
  validateAttachmentFile,
  type TaskAttachment,
} from "@/entities/attachment/client";
import { createBrowserSupabaseClient } from "@/shared/api/supabase/browser";
import { getSupabasePublicConfig } from "@/shared/config/env";

type UseTaskAttachmentsOptions = {
  workspaceId: string;
  projectId: string;
  taskId: string;
  initialAttachments: TaskAttachment[];
};

const attachmentSelection =
  "id, workspace_id, project_id, task_id, uploader_id, storage_path, file_name, content_type, size_bytes, created_at, uploader:profiles!attachments_uploader_id_fkey(display_name, avatar_path)";

class UploadCancelledError extends Error {
  constructor() {
    super("Attachment upload cancelled.");
    this.name = "UploadCancelledError";
  }
}

type ActiveUpload = {
  upload: Upload;
  reject: (reason: UploadCancelledError) => void;
};

export function useTaskAttachments({
  workspaceId,
  projectId,
  taskId,
  initialAttachments,
}: UseTaskAttachmentsOptions) {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const queryKey = useMemo(
    () => ["task-attachments", workspaceId, projectId, taskId] as const,
    [workspaceId, projectId, taskId],
  );
  const [uploadProgress, setUploadProgress] = useState<number>();
  const activeUploadRef = useRef<ActiveUpload | undefined>(undefined);

  const attachmentsQuery = useQuery({
    queryKey,
    initialData: initialAttachments,
    queryFn: async (): Promise<TaskAttachment[]> => {
      const { data, error } = await supabase
        .from("attachments")
        .select(attachmentSelection)
        .eq("workspace_id", workspaceId)
        .eq("project_id", projectId)
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return data.map(({ uploader, ...attachment }) => ({
        ...attachment,
        uploader: {
          displayName: uploader.display_name,
          avatarPath: uploader.avatar_path,
        },
      }));
    },
  });

  useEffect(() => {
    queryClient.setQueryData<TaskAttachment[]>(queryKey, initialAttachments);
  }, [initialAttachments, queryClient, queryKey]);

  const uploadFile = async (file: File) => {
    const validation = validateAttachmentFile(file);
    if (!validation.success) {
      toast.error(validation.message);
      return false;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sign in again before uploading a file.");
      return false;
    }

    const objectId = crypto.randomUUID();
    const storagePath = `${workspaceId}/${projectId}/${taskId}/${objectId}`;
    const { url } = getSupabasePublicConfig();
    setUploadProgress(0);

    try {
      await new Promise<void>((resolve, reject) => {
        const upload = new Upload(file, {
          endpoint: `${url.replace(/\/$/, "")}/storage/v1/upload/resumable`,
          retryDelays: [0, 1000, 3000, 5000],
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
          uploadDataDuringCreation: true,
          removeFingerprintOnSuccess: true,
          chunkSize: 6 * 1024 * 1024,
          metadata: {
            bucketName: TASK_ATTACHMENTS_BUCKET,
            objectName: storagePath,
            contentType: validation.contentType,
            cacheControl: "3600",
          },
          onError: (error) => {
            if (activeUploadRef.current?.upload !== upload) return;
            activeUploadRef.current = undefined;
            reject(error);
          },
          onProgress: (uploaded, total) => {
            setUploadProgress(Math.round((uploaded / total) * 100));
          },
          onSuccess: () => {
            if (activeUploadRef.current?.upload !== upload) return;
            activeUploadRef.current = undefined;
            resolve();
          },
        });
        activeUploadRef.current = {
          upload,
          reject: (reason) => reject(reason),
        };
        upload.start();
      });

      const { error } = await supabase.rpc("create_attachment", {
        target_task_id: taskId,
        attachment_storage_path: storagePath,
        attachment_file_name: file.name.trim(),
        attachment_content_type: validation.contentType,
        attachment_size_bytes: file.size,
      });

      if (error) {
        await supabase.storage
          .from(TASK_ATTACHMENTS_BUCKET)
          .remove([storagePath]);
        throw error;
      }

      await queryClient.invalidateQueries({ queryKey });
      toast.success("File uploaded.");
      return true;
    } catch (error) {
      if (error instanceof UploadCancelledError) {
        toast.info("Upload cancelled.");
        return false;
      }

      toast.error("File upload failed. Please try again.");
      return false;
    } finally {
      activeUploadRef.current = undefined;
      setUploadProgress(undefined);
    }
  };

  const cancelUpload = async () => {
    const activeUpload = activeUploadRef.current;
    if (!activeUpload) return;

    activeUploadRef.current = undefined;
    try {
      await activeUpload.upload.abort(true);
    } finally {
      activeUpload.reject(new UploadCancelledError());
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (attachment: TaskAttachment) => {
      const { error: storageError } = await supabase.storage
        .from(TASK_ATTACHMENTS_BUCKET)
        .remove([attachment.storage_path]);
      if (storageError) throw storageError;

      const { error: metadataError } = await supabase
        .from("attachments")
        .delete()
        .eq("id", attachment.id)
        .eq("task_id", taskId);
      if (metadataError) throw metadataError;
    },
    onSuccess: () => {
      toast.success("File deleted.");
      return queryClient.invalidateQueries({ queryKey });
    },
    onError: () => toast.error("File could not be deleted."),
  });

  const downloadAttachment = async (attachment: TaskAttachment) => {
    const { data, error } = await supabase.storage
      .from(TASK_ATTACHMENTS_BUCKET)
      .createSignedUrl(attachment.storage_path, 60, {
        download: attachment.file_name,
      });

    if (error) {
      toast.error("A secure download link could not be created.");
      return;
    }

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.rel = "noopener";
    link.click();
  };

  return {
    attachments: attachmentsQuery.data,
    error: attachmentsQuery.error,
    uploadFile,
    cancelUpload,
    uploadProgress,
    isUploading: uploadProgress !== undefined,
    deleteAttachment: deleteMutation.mutateAsync,
    deletingAttachmentId: deleteMutation.variables?.id,
    downloadAttachment,
  };
}
