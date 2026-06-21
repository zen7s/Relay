"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
  type Over,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertCircle,
  Archive,
  CalendarDays,
  CircleDashed,
  GripVertical,
  RotateCcw,
} from "lucide-react";

import type { ProjectBoardColumn } from "@/entities/project";
import {
  filterTasks,
  type ProjectLabel,
  type Task,
  type TaskFilters,
  type TaskPriority,
} from "@/entities/task/client";
import type { WorkspaceMember } from "@/entities/workspace";
import {
  MoveTaskSelect,
  setTaskArchivedAction,
  TaskFormDialog,
  useLiveProjectTasks,
} from "@/features/task-management";
import { cn } from "@/shared/lib";
import { Avatar, AvatarFallback, Badge, Button } from "@/shared/ui";

type TaskContext = {
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
};

type KanbanBoardProps = {
  context: TaskContext;
  columns: ProjectBoardColumn[];
  tasks: Task[];
  labels: ProjectLabel[];
  members: WorkspaceMember[];
  filters?: TaskFilters;
  readOnly?: boolean;
  highlightedTaskId?: string | undefined;
};

const priorityLabels: Record<TaskPriority, string> = {
  no_priority: "No priority",
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityTones: Record<TaskPriority, string> = {
  no_priority: "text-muted-foreground",
  low: "text-sky-700 dark:text-sky-400",
  medium: "text-amber-700 dark:text-amber-400",
  high: "text-orange-700 dark:text-orange-400",
  urgent: "text-rose-700 dark:text-rose-400",
};

function memberInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDueDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function TaskCard({
  context,
  task,
  columns,
  labels,
  members,
  readOnly = false,
  highlighted = false,
  moving = false,
  reducedMotion = false,
  detailsHref,
}: {
  context: TaskContext;
  task: Task;
  columns: ProjectBoardColumn[];
  labels: ProjectLabel[];
  members: WorkspaceMember[];
  readOnly?: boolean;
  highlighted?: boolean;
  moving?: boolean;
  reducedMotion?: boolean;
  detailsHref: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", columnId: task.column_id },
    disabled: readOnly,
    transition: reducedMotion
      ? null
      : {
          duration: 180,
          easing: "cubic-bezier(0.25, 1, 0.5, 1)",
        },
  });
  const taskLabels = labels.filter((label) => task.labelIds.includes(label.id));
  const assignee = members.find((member) => member.id === task.assignee_id);
  const overdue =
    task.due_date && new Date(`${task.due_date}T23:59:59`) < new Date();

  return (
    <article
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      aria-label={task.title}
      data-testid={`task-${task.id}`}
      className={cn(
        "rounded-xl border bg-card p-3 shadow-xs transition-[border-color,box-shadow]",
        highlighted && "border-primary/50 ring-2 ring-primary/10",
        isDragging && "opacity-30",
        moving && "animate-pulse motion-reduce:animate-none",
      )}
    >
      {taskLabels.length ? (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {taskLabels.map((label) => (
            <span
              key={label.id}
              className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
            >
              <span
                className="size-1.5 rounded-full"
                style={{ backgroundColor: label.color }}
              />
              {label.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-start gap-2">
        <h3 className="min-w-0 flex-1 text-sm leading-5 font-medium">
          <Link
            href={detailsHref}
            scroll={false}
            className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {task.title}
          </Link>
        </h3>
        {!readOnly ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Drag ${task.title}`}
            title="Drag task. Press Space or Enter for keyboard movement."
            className="-mt-1 -mr-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical />
          </Button>
        ) : null}
      </div>
      {task.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {task.priority !== "no_priority" ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium",
              priorityTones[task.priority],
            )}
          >
            <AlertCircle className="size-3" />
            {priorityLabels[task.priority]}
          </span>
        ) : null}
        {task.due_date ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px] text-muted-foreground",
              overdue && "font-medium text-destructive",
            )}
          >
            <CalendarDays className="size-3" />
            {formatDueDate(task.due_date)}
          </span>
        ) : null}
        {assignee ? (
          <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Avatar className="size-5">
              <AvatarFallback className="text-[8px]">
                {memberInitials(assignee.displayName)}
              </AvatarFallback>
            </Avatar>
            <span className="sr-only">Assigned to {assignee.displayName}</span>
          </span>
        ) : null}
      </div>

      {!readOnly ? (
        <div className="mt-3 flex items-center gap-1 border-t pt-2.5">
          <TaskFormDialog
            context={context}
            columns={columns}
            labels={labels}
            members={members}
            task={task}
          />
          <MoveTaskSelect
            context={context}
            task={{
              id: task.id,
              title: task.title,
              columnId: task.column_id,
            }}
            columns={columns}
          />
          <form action={setTaskArchivedAction}>
            <input
              type="hidden"
              name="workspaceId"
              value={context.workspaceId}
            />
            <input
              type="hidden"
              name="workspaceSlug"
              value={context.workspaceSlug}
            />
            <input type="hidden" name="projectId" value={context.projectId} />
            <input type="hidden" name="taskId" value={task.id} />
            <input type="hidden" name="archived" value="true" />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              aria-label={`Archive ${task.title}`}
            >
              <Archive />
            </Button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

function KanbanColumn({
  context,
  column,
  columns,
  tasks,
  labels,
  members,
  readOnly,
  highlightedTaskId,
  movingTaskId,
  reducedMotion,
  detailsHrefFor,
}: {
  context: TaskContext;
  column: ProjectBoardColumn;
  columns: ProjectBoardColumn[];
  tasks: Task[];
  labels: ProjectLabel[];
  members: WorkspaceMember[];
  readOnly: boolean;
  highlightedTaskId?: string | undefined;
  movingTaskId?: string | undefined;
  reducedMotion: boolean;
  detailsHrefFor: (taskId: string) => string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${column.id}`,
    data: { type: "column", columnId: column.id },
    disabled: readOnly,
  });

  return (
    <article
      ref={setNodeRef}
      aria-label={column.name}
      data-testid={`column-${column.id}`}
      className={cn(
        "min-h-[30rem] rounded-2xl border bg-muted/35 p-3 transition-[border-color,background-color,box-shadow]",
        isOver && "border-primary/40 bg-primary/5 ring-2 ring-primary/10",
      )}
    >
      <header className="flex items-center justify-between gap-3 px-1 py-1">
        <h2 className="text-sm font-semibold">{column.name}</h2>
        <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground shadow-xs">
          {tasks.length}
        </span>
      </header>
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-3 space-y-2.5">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              context={context}
              task={task}
              columns={columns}
              labels={labels}
              members={members}
              readOnly={readOnly}
              highlighted={task.id === highlightedTaskId}
              moving={task.id === movingTaskId}
              reducedMotion={reducedMotion}
              detailsHref={detailsHrefFor(task.id)}
            />
          ))}
          {!tasks.length ? (
            <div className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-4 text-center">
              <CircleDashed className="size-4 text-muted-foreground/60" />
              <p className="mt-2 text-xs text-muted-foreground">
                Drop a task here or create one.
              </p>
            </div>
          ) : null}
          {!readOnly ? (
            <TaskFormDialog
              context={context}
              columns={columns}
              labels={labels}
              members={members}
              defaultColumnId={column.id}
              buttonLabel="Add task"
              buttonVariant="ghost"
              buttonSize="sm"
              className="w-full text-muted-foreground"
            />
          ) : null}
        </div>
      </SortableContext>
    </article>
  );
}

export function KanbanBoard({
  context,
  columns,
  tasks,
  labels,
  members,
  filters = {},
  readOnly = false,
  highlightedTaskId,
}: KanbanBoardProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  const {
    tasks: liveTasks,
    moveTask,
    movingTaskId,
    realtimeStatus,
  } = useLiveProjectTasks({
    workspaceId: context.workspaceId,
    projectId: context.projectId,
    initialTasks: tasks,
  });
  const [activeTaskId, setActiveTaskId] = useState<string>();
  const [reducedMotion, setReducedMotion] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailsHrefFor = useCallback(
    (taskId: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("task", taskId);
      return `${pathname}?${nextParams.toString()}`;
    },
    [pathname, searchParams],
  );
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);
  const activeTasks = useMemo(
    () => liveTasks.filter((task) => !task.archived_at),
    [liveTasks],
  );
  const visibleTasks = useMemo(
    () => filterTasks(activeTasks, filters),
    [activeTasks, filters],
  );
  const activeTask = activeTasks.find((task) => task.id === activeTaskId);
  const accessibility = useMemo(() => {
    const taskTitle = (id: string | number) =>
      activeTasks.find((task) => task.id === String(id))?.title ?? "task";
    const targetDescription = (over: Over | null) => {
      if (!over) return "outside a drop target";
      const targetTask = activeTasks.find(
        (task) => task.id === String(over.id),
      );
      if (targetTask) {
        const column = columns.find(
          (candidate) => candidate.id === targetTask.column_id,
        );
        return `${targetTask.title}${column ? ` in ${column.name}` : ""}`;
      }
      const columnId = String(over.data.current?.columnId ?? "");
      const column = columns.find((candidate) => candidate.id === columnId);
      return column ? `${column.name} column` : "a drop target";
    };

    return {
      screenReaderInstructions: {
        draggable:
          "Press Space or Enter to pick up a task. Use the arrow keys to move it, then press Space or Enter to drop. Press Escape to cancel.",
      },
      announcements: {
        onDragStart: ({ active }: DragStartEvent) =>
          `Picked up ${taskTitle(active.id)}.`,
        onDragOver: ({ active, over }: DragEndEvent) =>
          `${taskTitle(active.id)} is over ${targetDescription(over)}.`,
        onDragEnd: ({ active, over }: DragEndEvent) =>
          over
            ? `Dropped ${taskTitle(active.id)} on ${targetDescription(over)}.`
            : `Cancelled moving ${taskTitle(active.id)}.`,
        onDragCancel: ({ active }: DragCancelEvent) =>
          `Cancelled moving ${taskTitle(active.id)}.`,
      },
    };
  }, [activeTasks, columns]);

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragCancel() {
    setActiveTaskId(undefined);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(undefined);
    if (!event.over || readOnly) return;

    const taskId = String(event.active.id);
    const sourceTask = activeTasks.find((task) => task.id === taskId);
    if (!sourceTask) return;

    const overType = event.over.data.current?.type;
    const overId = String(event.over.id);
    let targetColumnId: string;
    let targetIndex: number;

    if (overType === "task") {
      const overTask = activeTasks.find((task) => task.id === overId);
      if (!overTask) return;
      targetColumnId = overTask.column_id;

      const destinationTasks = activeTasks
        .filter((task) => task.column_id === targetColumnId)
        .sort((first, second) => first.position - second.position);
      const overIndex = destinationTasks.findIndex(
        (task) => task.id === overTask.id,
      );
      const sourceIndex = destinationTasks.findIndex(
        (task) => task.id === sourceTask.id,
      );

      if (sourceTask.column_id === targetColumnId) {
        if (sourceIndex === overIndex) return;
        targetIndex = overIndex;
      } else {
        const tasksWithoutSource = destinationTasks.filter(
          (task) => task.id !== sourceTask.id,
        );
        const indexWithoutSource = tasksWithoutSource.findIndex(
          (task) => task.id === overTask.id,
        );
        const translated = event.active.rect.current.translated;
        const belowCenter =
          translated !== null &&
          translated.top > event.over.rect.top + event.over.rect.height / 2;
        targetIndex = indexWithoutSource + (belowCenter ? 1 : 0);
      }
    } else if (overType === "column") {
      targetColumnId = String(event.over.data.current?.columnId);
      targetIndex = activeTasks.filter(
        (task) =>
          task.column_id === targetColumnId && task.id !== sourceTask.id,
      ).length;
    } else {
      return;
    }

    moveTask({ taskId, targetColumnId, targetIndex });
  }

  return (
    <section aria-label="Kanban board" className="min-w-0 overflow-hidden">
      <div className="mb-2 flex items-center justify-end px-1">
        <span
          aria-label="Realtime status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <span
            className={cn(
              "size-1.5 rounded-full",
              realtimeStatus === "live"
                ? "bg-emerald-500"
                : realtimeStatus === "connecting"
                  ? "animate-pulse bg-amber-500"
                  : "bg-muted-foreground/50",
            )}
          />
          {realtimeStatus === "live"
            ? "Live updates"
            : realtimeStatus === "connecting"
              ? "Connecting"
              : "Reconnecting"}
        </span>
      </div>
      <DndContext
        accessibility={accessibility}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-max auto-cols-[18rem] grid-flow-col gap-3 xl:min-w-0 xl:grid-flow-row xl:grid-cols-5">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                context={context}
                column={column}
                columns={columns}
                tasks={visibleTasks
                  .filter((task) => task.column_id === column.id)
                  .sort((first, second) => first.position - second.position)}
                labels={labels}
                members={members}
                readOnly={readOnly}
                highlightedTaskId={highlightedTaskId}
                movingTaskId={movingTaskId}
                reducedMotion={reducedMotion}
                detailsHrefFor={detailsHrefFor}
              />
            ))}
          </div>
        </div>
        <DragOverlay
          dropAnimation={
            reducedMotion ? null : { duration: 180, easing: "ease-out" }
          }
        >
          {activeTask ? (
            <div
              data-testid="task-drag-overlay"
              className="w-64 rounded-xl border border-primary/30 bg-card p-3 text-sm font-medium shadow-xl"
            >
              {activeTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </section>
  );
}

export function ArchivedTaskList({
  context,
  tasks,
  labels,
  members,
  readOnly = false,
}: Omit<KanbanBoardProps, "columns">) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailsHrefFor = useCallback(
    (taskId: string) => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("task", taskId);
      return `${pathname}?${nextParams.toString()}`;
    },
    [pathname, searchParams],
  );

  return tasks.length ? (
    <section
      aria-label="Archived tasks"
      className="grid gap-3 md:grid-cols-2 xl:grid-cols-3"
    >
      {tasks.map((task) => {
        const taskLabels = labels.filter((label) =>
          task.labelIds.includes(label.id),
        );
        const assignee = members.find(
          (member) => member.id === task.assignee_id,
        );

        return (
          <article
            key={task.id}
            aria-label={task.title}
            className="rounded-xl border bg-card p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate font-medium">
                  <Link
                    href={detailsHrefFor(task.id)}
                    scroll={false}
                    className="rounded-sm hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    {task.title}
                  </Link>
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {priorityLabels[task.priority]}
                  {assignee ? ` · ${assignee.displayName}` : " · Unassigned"}
                </p>
              </div>
              <Badge variant="secondary">Archived</Badge>
            </div>
            {taskLabels.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {taskLabels.map((label) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px]"
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </span>
                ))}
              </div>
            ) : null}
            {!readOnly ? (
              <form
                action={setTaskArchivedAction}
                className="mt-4 border-t pt-3"
              >
                <input
                  type="hidden"
                  name="workspaceId"
                  value={context.workspaceId}
                />
                <input
                  type="hidden"
                  name="workspaceSlug"
                  value={context.workspaceSlug}
                />
                <input
                  type="hidden"
                  name="projectId"
                  value={context.projectId}
                />
                <input type="hidden" name="taskId" value={task.id} />
                <input type="hidden" name="archived" value="false" />
                <Button type="submit" variant="outline" size="sm">
                  <RotateCcw />
                  Restore task
                </Button>
              </form>
            ) : null}
          </article>
        );
      })}
    </section>
  ) : (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
      <Archive className="size-6 text-muted-foreground" />
      <h2 className="mt-3 font-semibold">No archived tasks</h2>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Archived work stays here until you restore it.
      </p>
    </div>
  );
}
