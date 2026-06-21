import { describe, expect, it } from "vitest";

import { createProjectSchema, updateProjectSchema } from "./schemas";

const validProject = {
  workspaceId: "22000000-0000-4000-8000-000000000001",
  workspaceSlug: "product-studio",
  name: "Product launch",
  key: "launch",
  color: "#6366f1",
  description: "Ship the next release.",
};

describe("project schemas", () => {
  it("normalizes keys, colors, and surrounding whitespace", () => {
    expect(
      createProjectSchema.parse({
        ...validProject,
        name: "  Product launch  ",
        key: " launch ",
        color: " #6366f1 ",
      }),
    ).toMatchObject({
      name: "Product launch",
      key: "LAUNCH",
      color: "#6366F1",
    });
  });

  it("rejects malformed keys and colors", () => {
    const result = createProjectSchema.safeParse({
      ...validProject,
      key: "1",
      color: "indigo",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      key: expect.any(Array),
      color: expect.any(Array),
    });
  });

  it("requires a project reference when editing", () => {
    expect(
      updateProjectSchema.safeParse({ ...validProject, projectId: "nope" })
        .success,
    ).toBe(false);
  });
});
