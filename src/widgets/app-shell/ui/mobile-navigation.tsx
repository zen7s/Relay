"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Settings } from "lucide-react";

import { AccountMenu } from "@/features/account-menu";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { WorkspaceSwitcher } from "@/features/workspace-switcher";
import {
  getPrimaryNavigation,
  isNavigationItemActive,
} from "@/shared/config/navigation";
import { cn } from "@/shared/lib";
import {
  Button,
  RelayLogo,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui";

type MobileNavigationProps = {
  user: { displayName: string; email: string };
  workspace: { name: string; slug: string; role: string };
  workspaces: Array<{ name: string; slug: string; role: string }>;
};

export function MobileNavigationTrigger({
  user,
  workspace,
  workspaces,
}: MobileNavigationProps) {
  const pathname = usePathname();
  const navigation = getPrimaryNavigation(workspace.slug);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent aria-describedby="mobile-navigation-description">
        <div className="flex h-16 items-center border-b px-5 pr-14">
          <SheetTitle asChild>
            <RelayLogo />
          </SheetTitle>
          <SheetDescription
            id="mobile-navigation-description"
            className="sr-only"
          >
            Main application navigation
          </SheetDescription>
        </div>

        <div className="p-4">
          <WorkspaceSwitcher
            currentWorkspace={workspace}
            workspaces={workspaces}
          />
        </div>

        <nav aria-label="Mobile primary" className="flex-1 space-y-1 px-3">
          {navigation.map((item) => {
            const { label, href, icon: Icon, disabled } = item;
            const active = isNavigationItemActive(
              pathname,
              workspace.slug,
              item,
            );

            const className = cn(
              "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
              disabled
                ? "cursor-not-allowed text-muted-foreground/55"
                : active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
            );
            const content = (
              <>
                <Icon className="size-[1.1rem]" />
                {label}
              </>
            );

            return disabled ? (
              <span key={label} aria-disabled="true" className={className}>
                {content}
              </span>
            ) : (
              <SheetClose key={label} asChild>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={className}
                >
                  {content}
                </Link>
              </SheetClose>
            );
          })}
        </nav>

        <div className="space-y-1 border-t p-3">
          <SheetClose asChild>
            <Link
              href={`/w/${workspace.slug}/settings`}
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings className="size-[1.1rem]" />
              Settings
            </Link>
          </SheetClose>
          <ThemeSwitcher showLabel />
          <AccountMenu showDetails {...user} />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileBottomNavigation({
  workspaceSlug,
}: {
  workspaceSlug: string;
}) {
  const pathname = usePathname();
  const navigation = getPrimaryNavigation(workspaceSlug);

  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-4 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {navigation.map((item) => {
        const { label, href, icon: Icon, disabled } = item;
        const active = isNavigationItemActive(pathname, workspaceSlug, item);

        const className = cn(
          "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
          disabled
            ? "cursor-not-allowed text-muted-foreground/45"
            : active
              ? "text-primary"
              : "text-muted-foreground",
        );
        const content = (
          <>
            <Icon className="size-5" />
            {label}
          </>
        );

        return disabled ? (
          <span key={label} aria-disabled="true" className={className}>
            {content}
          </span>
        ) : (
          <Link
            key={label}
            href={href}
            aria-current={active ? "page" : undefined}
            className={className}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}
