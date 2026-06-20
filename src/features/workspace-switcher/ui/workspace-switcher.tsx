"use client";

import { Building2, Check, ChevronsUpDown, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";

type WorkspaceSwitcherProps = {
  compact?: boolean;
};

const workspaces = ["Northstar Studio", "Relay Labs"];

export function WorkspaceSwitcher({ compact = false }: WorkspaceSwitcherProps) {
  return (
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
                  Northstar Studio
                </span>
                <span className="block truncate text-[11px] font-normal text-muted-foreground">
                  8 members
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
        className="w-60"
      >
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace, index) => (
          <DropdownMenuItem
            key={workspace}
            onSelect={() => toast.info(`${workspace} selected`)}
          >
            <Building2 />
            {workspace}
            {index === 0 ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => toast.info("Workspace creation comes next")}
        >
          <Plus />
          Create workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
