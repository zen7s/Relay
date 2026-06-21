import { Search } from "lucide-react";

import { AccountMenu } from "@/features/account-menu";
import { ThemeSwitcher } from "@/features/theme-switcher";
import { Input, RelayLogo } from "@/shared/ui";

import { MobileNavigationTrigger } from "./mobile-navigation";

type AppHeaderProps = {
  user: { displayName: string; email: string };
  workspace: { name: string; slug: string; role: string };
  workspaces: Array<{ name: string; slug: string; role: string }>;
};

export function AppHeader({ user, workspace, workspaces }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-lg sm:px-6 lg:px-8">
      <MobileNavigationTrigger
        user={user}
        workspace={workspace}
        workspaces={workspaces}
      />
      <RelayLogo className="mr-auto md:hidden" />

      <div className="relative hidden w-full max-w-md sm:block">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search projects, tasks, or people…"
          aria-label="Search"
          className="bg-muted/60 pl-9 shadow-none"
        />
        <kbd className="pointer-events-none absolute top-1/2 right-2.5 hidden -translate-y-1/2 rounded border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground lg:block">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        <ThemeSwitcher />
        <AccountMenu {...user} />
      </div>
    </header>
  );
}
