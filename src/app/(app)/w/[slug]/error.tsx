"use client";

import { useEffect } from "react";

import { ErrorState } from "@/shared/ui";

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <ErrorState
      title="We could not load this workspace"
      description="The workspace data did not arrive as expected. Try loading it again."
      onRetry={reset}
    />
  );
}
