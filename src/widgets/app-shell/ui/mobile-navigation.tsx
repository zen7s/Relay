"use client";

import Link from "next/link";
import { Menu, Settings } from "lucide-react";

import { AccountMenu } from "@/features/account-menu";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { WorkspaceSwitcher } from "@/features/workspace-switcher";
import { primaryNavigation } from "@/shared/config/navigation";
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

export function MobileNavigationTrigger() {
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
          <WorkspaceSwitcher />
        </div>

        <nav aria-label="Mobile primary" className="flex-1 space-y-1 px-3">
          {primaryNavigation.map(({ label, href, icon: Icon, active }) => (
            <SheetClose key={label} asChild>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-[1.1rem]" />
                {label}
              </Link>
            </SheetClose>
          ))}
        </nav>

        <div className="space-y-1 border-t p-3">
          <SheetClose asChild>
            <Link
              href="/settings"
              className="flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <Settings className="size-[1.1rem]" />
              Settings
            </Link>
          </SheetClose>
          <ThemeSwitcher showLabel />
          <AccountMenu showDetails />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileBottomNavigation() {
  return (
    <nav
      aria-label="Mobile quick navigation"
      className="fixed inset-x-0 bottom-0 z-40 grid h-[calc(4rem+env(safe-area-inset-bottom))] grid-cols-4 border-t bg-background/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      {primaryNavigation.map(({ label, href, icon: Icon, active }) => (
        <Link
          key={label}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex flex-col items-center justify-center gap-1 text-[10px] font-medium",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
