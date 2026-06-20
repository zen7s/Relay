import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileBottomNavigation } from "./mobile-navigation";

type AppShellProps = Readonly<{
  children: React.ReactNode;
  user: { displayName: string; email: string };
  workspace: { name: string; role: string };
}>;

export function AppShell({ children, user, workspace }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar user={user} workspace={workspace} />
      <div className="min-w-0 md:pl-18 xl:pl-64">
        <AppHeader user={user} workspace={workspace} />
        <main className="min-w-0 px-4 pt-6 pb-24 sm:px-6 md:pb-8 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
