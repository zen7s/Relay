import Link from "next/link";
import { ArrowLeft, CircleDashed, FolderKanban } from "lucide-react";

import type { ProjectBoard } from "@/entities/project";
import type { CurrentWorkspace } from "@/entities/workspace";
import { ProjectFormDialog } from "@/features/project-management";
import { Badge, Button } from "@/shared/ui";

type ProjectBoardPageProps = {
  workspace: CurrentWorkspace;
  board: ProjectBoard;
};

export function ProjectBoardPage({ workspace, board }: ProjectBoardPageProps) {
  const { project, columns } = board;
  const canManage = workspace.role === "owner" || workspace.role === "admin";

  return (
    <div className="mx-auto w-full max-w-[1800px]">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/w/${workspace.slug}/projects`}>
          <ArrowLeft />
          All projects
        </Link>
      </Button>

      <header className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
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
        {canManage && !project.archived_at ? (
          <ProjectFormDialog
            workspace={{ id: workspace.id, slug: workspace.slug }}
            project={project}
            buttonVariant="outline"
            buttonSize="default"
          />
        ) : null}
      </header>

      {project.archived_at ? (
        <p
          role="status"
          className="mt-6 rounded-xl border bg-muted px-4 py-3 text-sm text-muted-foreground"
        >
          This project is archived. Restore it from the Projects page before
          making changes.
        </p>
      ) : null}

      <section aria-label={`${project.name} board`} className="mt-7">
        <div className="overflow-x-auto pb-4">
          <div className="grid min-w-max auto-cols-[17.5rem] grid-flow-col gap-3 xl:min-w-0 xl:grid-flow-row xl:grid-cols-5">
            {columns.map((column) => (
              <article
                key={column.id}
                aria-label={column.name}
                className="min-h-[28rem] rounded-2xl border bg-muted/35 p-3"
              >
                <header className="flex items-center justify-between gap-3 px-1 py-1">
                  <h2 className="text-sm font-semibold">{column.name}</h2>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground shadow-xs">
                    0
                  </span>
                </header>
                <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 px-4 text-center">
                  <CircleDashed className="size-5 text-muted-foreground/60" />
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    Tasks will arrive in the next stage.
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
