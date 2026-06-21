"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpCircle, Settings } from "lucide-react";

import { AccountMenu } from "@/features/account-menu";
import { WorkspaceSwitcher } from "@/features/workspace-switcher";
import { getPrimaryNavigation } from "@/shared/config/navigation";
import { cn } from "@/shared/lib";
import { RelayLogo } from "@/shared/ui";

type AppSidebarProps = {
  user: { displayName: string; email: string };
  workspace: { name: string; slug: string; role: string };
  workspaces: Array<{ name: string; slug: string; role: string }>;
};

export function AppSidebar({ user, workspace, workspaces }: AppSidebarProps) {
  const pathname = usePathname();
  const navigation = getPrimaryNavigation(workspace.slug);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-18 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex xl:w-64">
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-sidebar-border px-3 xl:justify-start xl:px-5">
        <RelayLogo compact className="xl:hidden" />
        <RelayLogo className="hidden xl:flex" />
      </div>

      <div className="flex justify-center p-3 xl:hidden">
        <WorkspaceSwitcher
          compact
          currentWorkspace={workspace}
          workspaces={workspaces}
        />
      </div>
      <div className="hidden p-3 xl:block">
        <WorkspaceSwitcher
          currentWorkspace={workspace}
          workspaces={workspaces}
        />
      </div>

      <nav aria-label="Primary" className="flex-1 space-y-1 px-2.5 py-2">
        {navigation.map(({ label, href, icon: Icon, disabled }) => {
          const active =
            pathname === href ||
            (href !== `/w/${workspace.slug}` &&
              pathname.startsWith(`${href}/`));

          const className = cn(
            "flex h-10 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors xl:justify-start",
            disabled
              ? "cursor-not-allowed text-muted-foreground/55"
              : active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
          );
          const content = (
            <>
              <Icon className="size-[1.1rem] shrink-0" />
              <span className="hidden xl:inline">{label}</span>
            </>
          );

          return disabled ? (
            <span
              key={label}
              aria-disabled="true"
              title={`${label} coming in a later stage`}
              className={className}
            >
              {content}
            </span>
          ) : (
            <Link
              key={label}
              href={href}
              aria-current={active ? "page" : undefined}
              title={label}
              className={className}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-sidebar-border p-2.5">
        <span
          aria-disabled="true"
          title="Help"
          className="flex h-10 cursor-not-allowed items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground/55 xl:justify-start"
        >
          <HelpCircle className="size-[1.1rem]" />
          <span className="hidden xl:inline">Help & support</span>
        </span>
        <Link
          href={`/w/${workspace.slug}/settings`}
          title="Settings"
          className="flex h-10 items-center justify-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-foreground xl:justify-start"
        >
          <Settings className="size-[1.1rem]" />
          <span className="hidden xl:inline">Settings</span>
        </Link>
        <div className="hidden pt-1 xl:block">
          <AccountMenu showDetails {...user} />
        </div>
        <div className="flex justify-center pt-1 xl:hidden">
          <AccountMenu {...user} />
        </div>
      </div>
    </aside>
  );
}
