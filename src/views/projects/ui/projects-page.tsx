import Link from "next/link";
import { ArrowRight, FolderArchive, FolderKanban } from "lucide-react";

import type { Project } from "@/entities/project";
import type { CurrentWorkspace } from "@/entities/workspace";
import {
  ArchiveProjectButton,
  ProjectFormDialog,
} from "@/features/project-management";
import { cn } from "@/shared/lib";
import { Badge, Button } from "@/shared/ui";

type ProjectsPageProps = {
  workspace: CurrentWorkspace;
  projects: Project[];
  showArchived?: boolean;
  savedProjectId?: string | undefined;
  change?: "archived" | "restored" | undefined;
};

export function ProjectsPage({
  workspace,
  projects,
  showArchived = false,
  savedProjectId,
  change,
}: ProjectsPageProps) {
  const canManage = workspace.role === "owner" || workspace.role === "admin";
  const activeProjects = projects.filter((project) => !project.archived_at);
  const archivedProjects = projects.filter((project) => project.archived_at);
  const visibleProjects = showArchived ? archivedProjects : activeProjects;
  const workspaceReference = { id: workspace.id, slug: workspace.slug };

  return (
    <div className="mx-auto w-full max-w-[1440px]">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Projects
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Independent boards and workflows for {workspace.name}.
          </p>
        </div>
        {canManage ? (
          <ProjectFormDialog workspace={workspaceReference} />
        ) : null}
      </header>

      {savedProjectId || change ? (
        <p
          role="status"
          className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          {savedProjectId
            ? "Project details saved."
            : change === "archived"
              ? "Project archived. You can restore it at any time."
              : "Project restored to the active list."}
        </p>
      ) : null}

      <nav
        aria-label="Project status"
        className="mt-7 flex w-fit rounded-lg border bg-muted/40 p-1"
      >
        <Link
          href={`/w/${workspace.slug}/projects`}
          aria-current={!showArchived ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            !showArchived
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Active <span className="ml-1 text-xs">{activeProjects.length}</span>
        </Link>
        <Link
          href={`/w/${workspace.slug}/projects?archived=1`}
          aria-current={showArchived ? "page" : undefined}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            showArchived
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Archived
          <span className="ml-1 text-xs">{archivedProjects.length}</span>
        </Link>
      </nav>

      {visibleProjects.length ? (
        <section
          aria-label={showArchived ? "Archived projects" : "Active projects"}
          className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleProjects.map((project) => (
            <article
              key={project.id}
              aria-label={project.name}
              className="group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-xs transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: project.color }}
              />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{project.key}</Badge>
                    {project.archived_at ? (
                      <Badge variant="secondary">Archived</Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-3 truncate text-lg font-semibold">
                    {project.name}
                  </h2>
                </div>
                <span
                  className="grid size-9 shrink-0 place-items-center rounded-xl text-white shadow-sm"
                  style={{ backgroundColor: project.color }}
                >
                  <FolderKanban className="size-4" />
                </span>
              </div>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
                {project.description || "No project description yet."}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/w/${workspace.slug}/p/${project.id}/board`}>
                    Open board
                    <ArrowRight />
                  </Link>
                </Button>
                {canManage ? (
                  <div className="flex items-center">
                    {!project.archived_at ? (
                      <ProjectFormDialog
                        workspace={workspaceReference}
                        project={project}
                      />
                    ) : null}
                    <ArchiveProjectButton
                      workspace={workspaceReference}
                      project={project}
                    />
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="mt-5 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            {showArchived ? (
              <FolderArchive className="size-5" />
            ) : (
              <FolderKanban className="size-5" />
            )}
          </span>
          <h2 className="mt-4 font-semibold">
            {showArchived
              ? "No archived projects"
              : "Create your first project"}
          </h2>
          <p className="mt-1.5 max-w-md text-sm leading-6 text-muted-foreground">
            {showArchived
              ? "Projects you archive will stay here with their boards and data intact."
              : canManage
                ? "Start with a project and Relay will prepare Backlog, To do, In progress, Review, and Done for you."
                : "An Owner or Admin can create the first project for this workspace."}
          </p>
          {!showArchived && canManage ? (
            <ProjectFormDialog
              workspace={workspaceReference}
              buttonSize="sm"
              className="mt-5"
            />
          ) : null}
        </section>
      )}
    </div>
  );
}
