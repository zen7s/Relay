import { describe, expect, it } from "vitest";

import {
  archiveTaskSchema,
  createLabelSchema,
  createTaskSchema,
} from "./schemas";

const taskContext = {
  workspaceId: "23000000-0000-4000-8000-000000000001",
  workspaceSlug: "product-studio",
  projectId: "33000000-0000-4000-8000-000000000001",
};

describe("task schemas", () => {
  it("normalizes optional task fields", () => {
    expect(
      createTaskSchema.parse({
        ...taskContext,
        columnId: "43000000-0000-4000-8000-000000000001",
        title: "  Prepare brief  ",
        description: "  Define the story.  ",
        assigneeId: "",
        priority: "high",
        dueDate: "",
        labelIds: [],
      }),
    ).toMatchObject({
      title: "Prepare brief",
      description: "Define the story.",
      assigneeId: undefined,
      dueDate: undefined,
    });
  });

  it("rejects invalid priority and due date values", () => {
    const result = createTaskSchema.safeParse({
      ...taskContext,
      columnId: "43000000-0000-4000-8000-000000000001",
      title: "Task",
      description: "",
      assigneeId: "",
      priority: "critical",
      dueDate: "tomorrow",
      labelIds: [],
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors).toMatchObject({
      priority: expect.any(Array),
      dueDate: expect.any(Array),
    });
  });

  it("parses archive state and normalizes label colors", () => {
    expect(
      archiveTaskSchema.parse({
        ...taskContext,
        taskId: "53000000-0000-4000-8000-000000000001",
        archived: "true",
      }).archived,
    ).toBe(true);
    expect(
      createLabelSchema.parse({
        ...taskContext,
        name: " Feature ",
        color: "#6366f1",
      }),
    ).toMatchObject({ name: "Feature", color: "#6366F1" });
  });
});
