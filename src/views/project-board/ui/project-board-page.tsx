import Link from "next/link";
import { ArrowLeft, FolderKanban, Search, X } from "lucide-react";

import type { ProjectBoard } from "@/entities/project";
import {
  filterTasks,
  type ProjectLabel,
  type Task,
  type TaskFilters,
} from "@/entities/task";
import type { CurrentWorkspace, WorkspaceMember } from "@/entities/workspace";
import { ProjectFormDialog } from "@/features/project-management";
import {
  ProjectLabelsDialog,
  TaskFormDialog,
} from "@/features/task-management";
import { cn } from "@/shared/lib";
import { Badge, Button, Input, NativeSelect } from "@/shared/ui";
import { ArchivedTaskList, KanbanBoard } from "@/widgets/kanban-board";

type ProjectBoardPageProps = {
  workspace: CurrentWorkspace;
  board: ProjectBoard;
  tasks: Task[];
  labels: ProjectLabel[];
  members: WorkspaceMember[];
  filters: TaskFilters;
  showArchived?: boolean;
  createdTaskId?: string | undefined;
  savedTaskId?: string | undefined;
  change?: "archived" | "restored" | undefined;
};

const priorities = [
  { value: "", label: "All priorities" },
  { value: "no_priority", label: "No priority" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function ProjectBoardPage({
  workspace,
  board,
  tasks,
  labels,
  members,
  filters,
  showArchived = false,
  createdTaskId,
  savedTaskId,
  change,
}: ProjectBoardPageProps) {
  const { project, columns } = board;
  const canManageProject =
    workspace.role === "owner" || workspace.role === "admin";
  const readOnly = Boolean(project.archived_at);
  const activeTasks = tasks.filter((task) => !task.archived_at);
  const archivedTasks = tasks.filter((task) => task.archived_at);
  const visibleTasks = filterTasks(activeTasks, filters);
  const context = {
    workspaceId: workspace.id,
    workspaceSlug: workspace.slug,
    projectId: project.id,
  };
  const boardUrl = `/w/${workspace.slug}/p/${project.id}/board`;
  const hasFilters = Boolean(
    filters.query || filters.assigneeId || filters.priority || filters.labelId,
  );

  return (
    <div className="mx-auto w-full max-w-[1800px]">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/w/${workspace.slug}/projects`}>
          <ArrowLeft />
          All projects
        </Link>
      </Button>

      <header className="mt-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm"
            style={{ backgroundColor: project.color }}
          >
            <FolderKanban className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">
                {project.name}
              </h1>
              <Badge variant="outline">{project.key}</Badge>
              {project.archived_at ? (
                <Badge variant="secondary">Archived</Badge>
              ) : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              {project.description || "No project description yet."}
            </p>
          </div>
        </div>

        {!readOnly ? (
          <div className="flex flex-wrap gap-2">
            {canManageProject ? (
              <ProjectLabelsDialog context={context} labels={labels} />
            ) : null}
            {canManageProject ? (
              <ProjectFormDialog
                workspace={{ id: workspace.id, slug: workspace.slug }}
                project={project}
                buttonVariant="outline"
                buttonSize="default"
              />
            ) : null}
            <TaskFormDialog
              context={context}
              columns={columns}
              labels={labels}
              members={members}
              defaultColumnId={columns[0]?.id}
            />
          </div>
        ) : null}
      </header>

      {readOnly ? (
        <p
          role="status"
          className="mt-6 rounded-xl border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          This project is archived. Restore it from the Projects page before
          changing tasks.
        </p>
      ) : null}

      {createdTaskId || savedTaskId || change ? (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {createdTaskId
            ? "Task created."
            : savedTaskId
              ? "Task details saved."
              : change === "archived"
                ? "Task archived."
                : "Task restored to the board."}
        </p>
      ) : null}

      <nav
        aria-label="Board views"
        className="mt-6 flex w-fit rounded-lg border bg-muted/40 p-1"
      >
        <Link
          href={boardUrl}
          aria-current={!showArchived ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            !showArchived
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Board <span className="ml-1 text-xs">{activeTasks.length}</span>
        </Link>
        <Link
          href={`${boardUrl}?archived=1`}
          aria-current={showArchived ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            showArchived
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Archived <span className="ml-1 text-xs">{archivedTasks.length}</span>
        </Link>
      </nav>

      {!showArchived ? (
        <>
          <form
            key={`${filters.query ?? ""}|${filters.assigneeId ?? ""}|${filters.priority ?? ""}|${filters.labelId ?? ""}`}
            method="get"
            className="mt-4 grid gap-2 rounded-xl border bg-card p-3 sm:grid-cols-2 xl:grid-cols-[minmax(12rem,1fr)_12rem_10rem_11rem_auto]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={filters.query}
                placeholder="Search tasks"
                aria-label="Search tasks"
                className="pl-9"
              />
            </div>
            <NativeSelect
              name="assignee"
              defaultValue={filters.assigneeId ?? ""}
              aria-label="Filter by assignee"
            >
              <option value="">All assignees</option>
              <option value="unassigned">Unassigned</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.displayName}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              name="priority"
              defaultValue={filters.priority ?? ""}
              aria-label="Filter by priority"
            >
              {priorities.map((priority) => (
                <option key={priority.value} value={priority.value}>
                  {priority.label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              name="label"
              defaultValue={filters.labelId ?? ""}
              aria-label="Filter by label"
            >
              <option value="">All labels</option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {label.name}
                </option>
              ))}
            </NativeSelect>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary" className="flex-1">
                Apply
              </Button>
              {hasFilters ? (
                <Button asChild type="button" variant="ghost" size="icon">
                  <Link href={boardUrl} aria-label="Clear filters">
                    <X />
                  </Link>
                </Button>
              ) : null}
            </div>
          </form>

          {hasFilters ? (
            <p className="mt-3 text-xs text-muted-foreground" role="status">
              Showing {visibleTasks.length} of {activeTasks.length} active
              tasks.
            </p>
          ) : null}

          <div className="mt-4">
            <KanbanBoard
              context={context}
              columns={columns}
              tasks={visibleTasks}
              labels={labels}
              members={members}
              readOnly={readOnly}
              highlightedTaskId={createdTaskId ?? savedTaskId}
            />
          </div>
        </>
      ) : (
        <div className="mt-4">
          <ArchivedTaskList
            context={context}
            tasks={archivedTasks}
            labels={labels}
            members={members}
            readOnly={readOnly}
          />
        </div>
      )}
    </div>
  );
}
