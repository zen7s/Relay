import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  ListTodo,
} from "lucide-react";

import type { Project } from "@/entities/project";
import type { WorkspaceTaskStats } from "@/entities/task";
import { ProjectFormDialog } from "@/features/project-management";
import { Badge, Button } from "@/shared/ui";

type DashboardOverviewProps = {
  displayName: string;
  workspace: { id: string; name: string; slug: string; role: string };
  projects: Project[];
  taskStats: WorkspaceTaskStats;
};

export function DashboardOverview({
  displayName,
  workspace,
  projects,
  taskStats,
}: DashboardOverviewProps) {
  const firstName = displayName.split(/\s+/)[0] || displayName;
  const activeProjects = projects.filter((project) => !project.archived_at);
  const canManage = workspace.role === "owner" || workspace.role === "admin";
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const metrics = [
    {
      label: "Active projects",
      value: String(activeProjects.length),
      note:
        activeProjects.length === 1 ? "1 live board" : "Live project boards",
      icon: FolderKanban,
      tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      label: "Open tasks",
      value: String(taskStats.open),
      note: `${taskStats.urgent} urgent`,
      icon: ListTodo,
      tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    },
    {
      label: "Completed tasks",
      value: String(taskStats.completed),
      note: "Currently in Done",
      icon: CheckCircle2,
      tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Due in 7 days",
      value: String(taskStats.dueSoon),
      note: "Includes overdue work",
      icon: CalendarClock,
      tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{dateLabel}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Good morning, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Here’s what’s moving across {workspace.name} today.
          </p>
        </div>
        {canManage ? (
          <ProjectFormDialog
            workspace={{ id: workspace.id, slug: workspace.slug }}
          />
        ) : null}
      </section>

      <section
        aria-label="Workspace metrics"
        className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        {metrics.map(({ label, value, note, icon: Icon, tone }) => (
          <article
            key={label}
            className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 truncate text-2xl font-semibold tracking-tight capitalize">
                  {value}
                </p>
              </div>
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl ${tone}`}
              >
                <Icon className="size-[1.1rem]" />
              </span>
            </div>
            <p className="mt-3 truncate text-xs text-muted-foreground">
              {note}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Priority projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recently created boards in this workspace.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/w/${workspace.slug}/projects`}>
              View all
              <ArrowRight />
            </Link>
          </Button>
        </div>

        {activeProjects.length ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {activeProjects.slice(0, 3).map((project) => (
              <Link
                key={project.id}
                href={`/w/${workspace.slug}/p/${project.id}/board`}
                className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: project.color }}
                />
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Badge variant="outline">{project.key}</Badge>
                    <h3 className="mt-3 truncate font-semibold">
                      {project.name}
                    </h3>
                    <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                      {project.description || "No project description yet."}
                    </p>
                  </div>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <FolderKanban className="size-5" />
            </span>
            <h3 className="mt-4 font-semibold">No active projects yet</h3>
            <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">
              {canManage
                ? "Create the first project to give your team a shared board."
                : "An Owner or Admin can create the first project for your team."}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
