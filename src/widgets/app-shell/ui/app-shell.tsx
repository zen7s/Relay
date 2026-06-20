import { AppHeader } from "./app-header";
import { AppSidebar } from "./app-sidebar";
import { MobileBottomNavigation } from "./mobile-navigation";

export function AppShell({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar />
      <div className="min-w-0 md:pl-18 xl:pl-64">
        <AppHeader />
        <main className="min-w-0 px-4 pt-6 pb-24 sm:px-6 md:pb-8 lg:px-8 lg:pt-8">
          {children}
        </main>
      </div>
      <MobileBottomNavigation />
    </div>
  );
}
