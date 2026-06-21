import type { Task, TaskPriority } from "../api/get-project-tasks";

export type TaskFilters = {
  query?: string | undefined;
  assigneeId?: string | undefined;
  priority?: TaskPriority | undefined;
  labelId?: string | undefined;
};

export function filterTasks(tasks: Task[], filters: TaskFilters) {
  const query = filters.query?.trim().toLocaleLowerCase();

  return tasks.filter((task) => {
    if (
      query &&
      !`${task.title} ${task.description ?? ""}`
        .toLocaleLowerCase()
        .includes(query)
    ) {
      return false;
    }

    if (filters.assigneeId === "unassigned" && task.assignee_id) {
      return false;
    }

    if (
      filters.assigneeId &&
      filters.assigneeId !== "unassigned" &&
      task.assignee_id !== filters.assigneeId
    ) {
      return false;
    }

    if (filters.priority && task.priority !== filters.priority) return false;
    if (filters.labelId && !task.labelIds.includes(filters.labelId))
      return false;

    return true;
  });
}
