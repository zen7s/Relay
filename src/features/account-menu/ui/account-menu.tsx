"use client";

import { LogOut, Settings, UserRound } from "lucide-react";
import { toast } from "sonner";

import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";

type AccountMenuProps = {
  showDetails?: boolean;
};

export function AccountMenu({ showDetails = false }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={
            showDetails
              ? "h-auto w-full justify-start gap-3 px-2 py-2"
              : "size-9 rounded-full p-0"
          }
          aria-label="Open account menu"
        >
          <Avatar className="size-8">
            <AvatarFallback>AM</AvatarFallback>
          </Avatar>
          {showDetails ? (
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium">
                Alex Morgan
              </span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                alex@relay.team
              </span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-sm text-foreground">Alex Morgan</span>
          <span className="font-normal">alex@relay.team</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => toast.info("Profile settings coming soon")}
        >
          <UserRound />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => toast.info("Workspace settings coming soon")}
        >
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
