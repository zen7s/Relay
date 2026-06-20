"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { getSafeRedirectPath } from "@/shared/lib";
import { createBrowserSupabaseClient } from "@/shared/api/supabase/browser";
import { Button } from "@/shared/ui";

type GoogleSignInButtonProps = {
  next?: string;
};

export function GoogleSignInButton({ next = "/" }: GoogleSignInButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSignIn() {
    setPending(true);
    setError(undefined);

    try {
      const supabase = createBrowserSupabaseClient();
      const redirectPath = getSafeRedirectPath(next);
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", redirectPath);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: callback.toString() },
      });

      if (oauthError) {
        setError("Google sign-in is unavailable. Please try again.");
        setPending(false);
      }
    } catch {
      setError("Google sign-in is not configured for this environment.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="h-10 w-full"
        disabled={pending}
        onClick={handleSignIn}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <span
            aria-hidden="true"
            className="grid size-5 place-items-center rounded-full border text-xs font-semibold"
          >
            G
          </span>
        )}
        Continue with Google
      </Button>
      {error ? (
        <p role="alert" className="text-center text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
