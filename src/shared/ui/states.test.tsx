import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "./empty-state";
import { ErrorState } from "./error-state";

describe("content states", () => {
  it("renders an actionable empty state", async () => {
    const user = userEvent.setup();
    const handleAction = vi.fn();

    render(
      <EmptyState
        title="No projects yet"
        description="Create a project to give your team a shared focus."
        actionLabel="Create project"
        onAction={handleAction}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "No projects yet" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Create project" }));
    expect(handleAction).toHaveBeenCalledOnce();
  });

  it("announces an error and offers recovery", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(<ErrorState onRetry={handleRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(handleRetry).toHaveBeenCalledOnce();
  });
});
