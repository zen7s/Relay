import { describe, expect, it } from "vitest";

import { getPrimaryNavigation, isNavigationItemActive } from "./navigation";

describe("workspace navigation", () => {
  const workspaceSlug = "product-studio";
  const navigation = getPrimaryNavigation(workspaceSlug);
  const projects = navigation.find((item) => item.label === "Projects");
  const overview = navigation.find((item) => item.label === "Overview");

  if (!projects || !overview) throw new Error("Expected navigation items");

  it("keeps Projects active on list and board URLs", () => {
    expect(projects).toBeDefined();
    expect(
      isNavigationItemActive(
        `/w/${workspaceSlug}/projects`,
        workspaceSlug,
        projects,
      ),
    ).toBe(true);
    expect(
      isNavigationItemActive(
        `/w/${workspaceSlug}/p/project-id/board`,
        workspaceSlug,
        projects,
      ),
    ).toBe(true);
  });

  it("does not mark Overview active for nested workspace routes", () => {
    expect(overview).toBeDefined();
    expect(
      isNavigationItemActive(
        `/w/${workspaceSlug}/projects`,
        workspaceSlug,
        overview,
      ),
    ).toBe(false);
  });
});
