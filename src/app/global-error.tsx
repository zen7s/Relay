"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center p-6">
          <div className="max-w-md space-y-4 text-center">
            <h1 className="text-2xl font-semibold">
              Relay hit an unexpected error
            </h1>
            <p className="text-muted-foreground">
              The incident was recorded. Reload the page to continue.
            </p>
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload Relay
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
