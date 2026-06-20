import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "./safe-redirect";

describe("getSafeRedirectPath", () => {
  it("preserves internal paths", () => {
    expect(getSafeRedirectPath("/projects?view=board#active")).toBe(
      "/projects?view=board#active",
    );
  });

  it.each([
    "https://evil.example",
    "//evil.example/path",
    "javascript:alert(1)",
    "projects",
  ])("rejects unsafe redirect %s", (value) => {
    expect(getSafeRedirectPath(value, "/login")).toBe("/login");
  });
});
