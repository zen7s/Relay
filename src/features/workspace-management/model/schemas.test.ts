import { describe, expect, it } from "vitest";

import {
  deleteWorkspaceSchema,
  updateMemberRoleSchema,
  workspaceNameSchema,
} from "./schemas";

describe("workspace management schemas", () => {
  it("trims and validates workspace names", () => {
    expect(workspaceNameSchema.parse({ name: "  Product Lab  " })).toEqual({
      name: "Product Lab",
    });
    expect(workspaceNameSchema.safeParse({ name: "x" }).success).toBe(false);
  });

  it("does not allow Owner through the normal role mutation", () => {
    expect(
      updateMemberRoleSchema.safeParse({
        workspaceId: "21000000-0000-4000-8000-000000000001",
        workspaceSlug: "product-lab",
        userId: "11000000-0000-4000-8000-000000000001",
        role: "owner",
      }).success,
    ).toBe(false);
  });

  it("keeps destructive confirmation separate from the workspace name", () => {
    expect(
      deleteWorkspaceSchema.parse({
        workspaceId: "21000000-0000-4000-8000-000000000001",
        workspaceSlug: "product-lab",
        workspaceName: "Product Lab",
        confirmation: "Different",
      }).confirmation,
    ).toBe("Different");
  });
});
