"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";

import {
  createWorkspaceAction,
  initialWorkspaceActionState,
} from "@/features/workspace-management";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
} from "@/shared/ui";

type WorkspaceSwitcherProps = {
  compact?: boolean;
  currentWorkspace: { name: string; slug: string; role: string };
  workspaces: Array<{ name: string; slug: string; role: string }>;
};

export function WorkspaceSwitcher({
  compact = false,
  currentWorkspace,
  workspaces,
}: WorkspaceSwitcherProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [state, createAction, pending] = useActionState(
    createWorkspaceAction,
    initialWorkspaceActionState,
  );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={compact ? "icon" : "default"}
            className={
              compact
                ? "size-10 border-sidebar-border bg-sidebar"
                : "h-auto w-full justify-start border-sidebar-border bg-sidebar px-2.5 py-2 shadow-none"
            }
            aria-label="Switch workspace"
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="size-4" />
            </span>
            {compact ? null : (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-medium">
                    {currentWorkspace.name}
                  </span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground capitalize">
                    {currentWorkspace.role}
                  </span>
                </span>
                <ChevronsUpDown className="size-4 text-muted-foreground" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={compact ? "right" : "bottom"}
          align="start"
          className="w-64"
        >
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((workspace) => (
            <DropdownMenuItem key={workspace.slug} asChild>
              <Link href={`/w/${workspace.slug}`}>
                <Building2 />
                <span className="min-w-0 flex-1 truncate">
                  {workspace.name}
                </span>
                {workspace.slug === currentWorkspace.slug ? (
                  <Check className="ml-auto" />
                ) : null}
              </Link>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setCreateOpen(true);
            }}
          >
            <Plus />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Create a separate home for another team or client.
            </DialogDescription>
          </DialogHeader>
          <form action={createAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Workspace name</Label>
              <Input
                id="workspace-name"
                name="name"
                placeholder="Acme Studio"
                defaultValue={state.values?.name}
                aria-invalid={Boolean(state.fieldErrors?.name)}
                autoFocus
              />
              {state.fieldErrors?.name?.[0] ? (
                <p className="text-xs text-destructive">
                  {state.fieldErrors.name[0]}
                </p>
              ) : null}
            </div>
            {state.message ? (
              <p role="alert" className="text-sm text-destructive">
                {state.message}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Creating…" : "Create workspace"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
