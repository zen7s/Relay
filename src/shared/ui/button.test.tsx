import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./button";

describe("Button", () => {
  it("handles an accessible user action", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(<Button onClick={handleClick}>Create project</Button>);

    await user.click(screen.getByRole("button", { name: "Create project" }));

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("supports link composition", () => {
    render(
      <Button asChild variant="link">
        <a href="/projects">View projects</a>
      </Button>,
    );

    expect(screen.getByRole("link", { name: "View projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });
});
