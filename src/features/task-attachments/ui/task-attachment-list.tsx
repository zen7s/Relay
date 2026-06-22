"use client";

import { useId, type ChangeEvent } from "react";
import { Download, FileText, Paperclip, Trash2, Upload, X } from "lucide-react";

import {
  ATTACHMENT_ACCEPT,
  formatAttachmentSize,
  type TaskAttachment,
} from "@/entities/attachment/client";
import type { WorkspaceMember } from "@/entities/workspace";
import { cn } from "@/shared/lib";
import { Button, Label, buttonVariants } from "@/shared/ui";

import { useTaskAttachments } from "../api/use-task-attachments";

type TaskAttachmentListProps = {
  context: {
    workspaceId: string;
    projectId: string;
    taskId: string;
  };
  currentUserId: string;
  currentUserRole: WorkspaceMember["role"];
  initialAttachments: TaskAttachment[];
  readOnly?: boolean;
};

export function TaskAttachmentList({
  context,
  currentUserId,
  currentUserRole,
  initialAttachments,
  readOnly = false,
}: TaskAttachmentListProps) {
  const inputId = useId();
  const {
    attachments,
    error,
    uploadFile,
    cancelUpload,
    uploadProgress,
    isUploading,
    deleteAttachment,
    deletingAttachmentId,
    downloadAttachment,
  } = useTaskAttachments({ ...context, initialAttachments });

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    await uploadFile(file);
    input.value = "";
  }

  return (
    <section aria-labelledby="task-files-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3
          id="task-files-heading"
          className="flex items-center gap-2 font-semibold"
        >
          <Paperclip className="size-4" />
          Files
          <span className="text-xs font-normal text-muted-foreground">
            {attachments.length}
          </span>
        </h3>
        {!readOnly ? (
          <>
            <input
              id={inputId}
              type="file"
              accept={ATTACHMENT_ACCEPT}
              className="sr-only"
              aria-label="Upload attachment"
              disabled={isUploading}
              onChange={chooseFile}
            />
            <Label
              htmlFor={inputId}
              aria-disabled={isUploading}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                isUploading && "pointer-events-none opacity-50",
              )}
            >
              <Upload />
              Add file
            </Label>
          </>
        ) : null}
      </div>

      {uploadProgress !== undefined ? (
        <div className="rounded-lg border bg-muted/40 p-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span>Uploading securely…</span>
            <span className="ml-auto">{uploadProgress}%</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Cancel attachment upload"
              onClick={() => void cancelUpload()}
            >
              <X />
            </Button>
          </div>
          <progress
            value={uploadProgress}
            max={100}
            aria-label="Attachment upload progress"
            className="h-1.5 w-full accent-primary"
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm">
          Files could not be loaded.
        </p>
      ) : null}

      <div className="space-y-2">
        {attachments.map((attachment) => {
          const canDelete =
            !readOnly &&
            (attachment.uploader_id === currentUserId ||
              currentUserRole === "owner" ||
              currentUserRole === "admin");

          return (
            <article
              key={attachment.id}
              aria-label={attachment.file_name}
              className="flex items-center gap-3 rounded-xl border bg-card p-3"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {attachment.file_name}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {formatAttachmentSize(attachment.size_bytes)} · uploaded by{" "}
                  {attachment.uploader.displayName}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Download ${attachment.file_name}`}
                onClick={() => void downloadAttachment(attachment)}
              >
                <Download />
              </Button>
              {canDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Delete ${attachment.file_name}`}
                  disabled={deletingAttachmentId === attachment.id}
                  onClick={() =>
                    void deleteAttachment(attachment).catch(() => undefined)
                  }
                >
                  <Trash2 />
                </Button>
              ) : null}
            </article>
          );
        })}
        {!attachments.length && !error ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium">No files attached</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add images, documents, or project handoff files up to 10 MB.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
