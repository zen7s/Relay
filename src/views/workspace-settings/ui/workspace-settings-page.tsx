import Link from "next/link";
import { AlertTriangle, Building2, LogOut } from "lucide-react";

import type { CurrentWorkspace } from "@/entities/workspace";
import {
  DeleteWorkspaceForm,
  leaveWorkspaceAction,
  RenameWorkspaceForm,
} from "@/features/workspace-management";
import { Badge, Button } from "@/shared/ui";

type WorkspaceSettingsPageProps = {
  workspace: CurrentWorkspace;
  saved?: boolean;
  ownerLeaveBlocked?: boolean;
};

export function WorkspaceSettingsPage({
  workspace,
  saved = false,
  ownerLeaveBlocked = false,
}: WorkspaceSettingsPageProps) {
  const canManage = workspace.role === "owner" || workspace.role === "admin";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <header>
        <p className="text-sm font-medium text-primary">Workspace</p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Settings
          </h1>
          <Badge variant="outline" className="capitalize">
            {workspace.role}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage details and lifecycle for {workspace.name}.
        </p>
        <nav
          aria-label="Settings sections"
          className="mt-5 flex flex-wrap gap-2"
        >
          <Button asChild size="sm" variant="outline">
            <Link href={`/w/${workspace.slug}/settings/profile`}>
              Personal settings
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/w/${workspace.slug}/settings`}>
              Workspace settings
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/w/${workspace.slug}/members`}>Members & roles</Link>
          </Button>
        </nav>
      </header>

      {saved ? (
        <p
          role="status"
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400"
        >
          Workspace settings saved.
        </p>
      ) : null}

      {ownerLeaveBlocked ? (
        <p
          role="alert"
          className="rounded-xl border bg-muted px-4 py-3 text-sm"
        >
          Transfer ownership to another member before leaving this workspace.
        </p>
      ) : null}

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">General</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The URL slug remains stable when the display name changes.
            </p>
          </div>
        </div>
        {canManage ? (
          <RenameWorkspaceForm workspace={workspace} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Only Owners and Admins can rename this workspace.
          </p>
        )}
      </section>

      <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
            <LogOut className="size-4" />
          </span>
          <div>
            <h2 className="font-semibold">Leave workspace</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account remains active and other workspaces are unaffected.
            </p>
          </div>
        </div>
        {workspace.role === "owner" ? (
          <p className="text-sm text-muted-foreground">
            Owners must transfer ownership from the Members page first.
          </p>
        ) : (
          <form action={leaveWorkspaceAction}>
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input type="hidden" name="workspaceSlug" value={workspace.slug} />
            <Button type="submit" variant="outline">
              Leave workspace
            </Button>
          </form>
        )}
      </section>

      {workspace.role === "owner" ? (
        <section className="rounded-2xl border border-destructive/30 bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start gap-3">
            <span className="grid size-9 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <AlertTriangle className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold">Delete workspace</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Permanently removes this workspace and all associated data.
              </p>
            </div>
          </div>
          <DeleteWorkspaceForm workspace={workspace} />
        </section>
      ) : null}
    </div>
  );
}
