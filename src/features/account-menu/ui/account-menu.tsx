"use client";

import Link from "next/link";
import { useTransition } from "react";
import { LogOut, Settings, UserRound } from "lucide-react";

import { signOutAction } from "@/features/auth";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  displayName: string;
  email: string;
  avatarUrl: string | null;
  workspaceSlug: string;
};

function getInitials(displayName: string) {
  return (
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "R"
  );
}

export function AccountMenu({
  showDetails = false,
  displayName,
  email,
  avatarUrl,
  workspaceSlug,
}: AccountMenuProps) {
  const [isSigningOut, startSignOutTransition] = useTransition();
  const initials = getInitials(displayName);

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
            {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {showDetails ? (
            <span className="min-w-0 text-left">
              <span className="block truncate text-sm font-medium">
                {displayName}
              </span>
              <span className="block truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-sm text-foreground">{displayName}</span>
          <span className="font-normal">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/w/${workspaceSlug}/settings/profile`}>
            <UserRound />
            Personal settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/w/${workspaceSlug}/settings`}>
            <Settings />
            Workspace settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onSelect={(event) => {
            event.preventDefault();
            startSignOutTransition(async () => {
              await signOutAction();
            });
          }}
        >
          <LogOut />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
