import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import WorkspaceError from "./error";

const { captureException } = vi.hoisted(() => ({
  captureException: vi.fn(),
}));

vi.mock("@sentry/nextjs", () => ({
  captureException,
  captureRouterTransitionStart: vi.fn(),
  init: vi.fn(),
}));

describe("workspace route states", () => {
  it("records a failed load and lets the user retry", async () => {
    const error = new Error("network unavailable");
    const reset = vi.fn();
    render(<WorkspaceError error={error} reset={reset} />);

    await waitFor(() => expect(captureException).toHaveBeenCalledWith(error));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  });
});
