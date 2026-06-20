import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MoreHorizontal,
  Target,
  TrendingUp,
} from "lucide-react";

import { CreateProjectButton } from "@/features/create-project";
import { Avatar, AvatarFallback, Badge, Button } from "@/shared/ui";

const metrics = [
  {
    label: "Active projects",
    value: "8",
    note: "+2 this month",
    icon: FolderKanban,
    tone: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400",
  },
  {
    label: "Open tasks",
    value: "42",
    note: "12 due today",
    icon: CheckCircle2,
    tone: "text-sky-600 bg-sky-500/10 dark:text-sky-400",
  },
  {
    label: "Team focus",
    value: "84%",
    note: "+6% vs last week",
    icon: Target,
    tone: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
  },
  {
    label: "Due this week",
    value: "7",
    note: "2 need attention",
    icon: CalendarDays,
    tone: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
  },
];

const projects = [
  {
    name: "Mobile app launch",
    description: "Ship the new onboarding and core mobile experience.",
    progress: 72,
    due: "Jun 28",
    status: "On track",
    members: ["AM", "NS", "JK"],
    accent: "bg-indigo-500",
  },
  {
    name: "Brand refresh",
    description: "Align the visual system across product and marketing.",
    progress: 48,
    due: "Jul 05",
    status: "At risk",
    members: ["AM", "LP"],
    accent: "bg-fuchsia-500",
  },
  {
    name: "Q3 product strategy",
    description: "Turn customer insights into a focused roadmap.",
    progress: 31,
    due: "Jul 12",
    status: "On track",
    members: ["TS", "JK", "AM", "NS"],
    accent: "bg-sky-500",
  },
];

const upcomingDeadlines = [
  {
    day: "24",
    month: "Jun",
    title: "Mobile onboarding QA",
    project: "Mobile app launch",
  },
  {
    day: "28",
    month: "Jun",
    title: "Release candidate",
    project: "Mobile app launch",
  },
  {
    day: "05",
    month: "Jul",
    title: "Brand guidelines review",
    project: "Brand refresh",
  },
];

function MetricCard({ metric }: { metric: (typeof metrics)[number] }) {
  const Icon = metric.icon;

  return (
    <article className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">
            {metric.value}
          </p>
        </div>
        <span
          className={`grid size-9 place-items-center rounded-xl ${metric.tone}`}
        >
          <Icon className="size-[1.1rem]" />
        </span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{metric.note}</p>
    </article>
  );
}

function ProjectCard({ project }: { project: (typeof projects)[number] }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${project.accent}`} />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{project.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-5 text-muted-foreground">
            {project.description}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`More options for ${project.name}`}
          className="-mt-1 -mr-2 shrink-0 text-muted-foreground"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-label={`${project.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={project.progress}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className={`h-full rounded-full ${project.accent}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 border-t pt-4">
        <div className="flex -space-x-2">
          {project.members.slice(0, 3).map((member) => (
            <Avatar key={member} className="size-7 border-2 border-card">
              <AvatarFallback className="text-[10px]">{member}</AvatarFallback>
            </Avatar>
          ))}
          {project.members.length > 3 ? (
            <span className="grid size-7 place-items-center rounded-full border-2 border-card bg-muted text-[10px] font-medium text-muted-foreground">
              +{project.members.length - 3}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={project.status === "On track" ? "success" : "secondary"}
          >
            {project.status}
          </Badge>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock3 className="size-3.5" />
            {project.due}
          </span>
        </div>
      </div>
    </article>
  );
}

type DashboardOverviewProps = {
  displayName: string;
  workspaceName: string;
};

export function DashboardOverview({
  displayName,
  workspaceName,
}: DashboardOverviewProps) {
  const firstName = displayName.split(/\s+/)[0] || displayName;

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Sunday, June 21</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Good morning, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Here’s what’s moving across {workspaceName} today.
          </p>
        </div>
        <CreateProjectButton className="self-start sm:self-auto" />
      </section>

      <section
        aria-label="Workspace metrics"
        className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Priority projects</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The work that needs your attention this week.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
            View all
            <ArrowRight className="size-4" />
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.name} project={project} />
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <article className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Workspace pulse</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed tasks over the last seven days.
              </p>
            </div>
            <Badge variant="success">
              <TrendingUp className="size-3" />
              14%
            </Badge>
          </div>
          <div
            className="mt-8 flex h-44 items-end gap-2 sm:gap-4"
            aria-label="Weekly task completion chart"
          >
            {[42, 58, 47, 76, 66, 88, 72].map((height, index) => (
              <div
                key={height}
                className="flex h-full flex-1 flex-col justify-end gap-2"
              >
                <div
                  className="min-h-4 rounded-md bg-primary/15 transition-colors hover:bg-primary/25"
                  style={{ height: `${height}%` }}
                  title={`${height} tasks completed`}
                />
                <span className="text-center text-[10px] text-muted-foreground sm:text-xs">
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border bg-card p-5 shadow-xs sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Upcoming deadlines</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The next milestones on your calendar.
              </p>
            </div>
            <CalendarDays className="size-5 text-muted-foreground" />
          </div>
          <div className="mt-5 divide-y">
            {upcomingDeadlines.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-center">
                  <span className="text-[9px] leading-none font-medium text-muted-foreground uppercase">
                    {item.month}
                  </span>
                  <span className="-mt-1 text-sm leading-none font-semibold">
                    {item.day}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {item.project}
                  </p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
