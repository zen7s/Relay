import { describe, expect, it } from "vitest";

import type { Task } from "../api/get-project-tasks";
import { filterTasks } from "./filter-tasks";

const tasks: Task[] = [
  {
    id: "task-one",
    workspace_id: "workspace",
    project_id: "project",
    column_id: "backlog",
    title: "Prepare launch brief",
    description: "Define the release story",
    assignee_id: "member-one",
    priority: "high",
    due_date: "2026-07-01",
    position: 1024,
    archived_at: null,
    created_at: "2026-06-21T00:00:00Z",
    updated_at: "2026-06-21T00:00:00Z",
    labelIds: ["feature"],
  },
  {
    id: "task-two",
    workspace_id: "workspace",
    project_id: "project",
    column_id: "done",
    title: "Review analytics",
    description: null,
    assignee_id: null,
    priority: "urgent",
    due_date: null,
    position: 1024,
    archived_at: null,
    created_at: "2026-06-21T00:00:00Z",
    updated_at: "2026-06-21T00:00:00Z",
    labelIds: ["data"],
  },
];

describe("filterTasks", () => {
  it("matches title and description without case sensitivity", () => {
    expect(filterTasks(tasks, { query: "RELEASE" })).toEqual([tasks[0]]);
  });

  it("combines assignee, priority, and label filters", () => {
    expect(
      filterTasks(tasks, {
        assigneeId: "member-one",
        priority: "high",
        labelId: "feature",
      }),
    ).toEqual([tasks[0]]);
  });

  it("supports an explicit unassigned filter", () => {
    expect(filterTasks(tasks, { assigneeId: "unassigned" })).toEqual([
      tasks[1],
    ]);
  });
});
