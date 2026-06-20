import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithOAuth } = vi.hoisted(() => ({
  signInWithOAuth: vi.fn(),
}));

vi.mock("@/shared/api/supabase/browser", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signInWithOAuth },
  }),
}));

import { GoogleSignInButton } from "./google-sign-in-button";

describe("GoogleSignInButton", () => {
  beforeEach(() => {
    signInWithOAuth.mockReset();
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  it("starts a Google PKCE flow with a safe callback", async () => {
    const user = userEvent.setup();
    render(<GoogleSignInButton next="/onboarding" />);

    await user.click(
      screen.getByRole("button", { name: "Continue with Google" }),
    );

    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: {
        redirectTo: "http://localhost:3000/auth/callback?next=%2Fonboarding",
      },
    });
  });
});
