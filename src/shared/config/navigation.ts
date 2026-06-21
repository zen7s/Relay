import {
  BarChart3,
  FolderKanban,
  LayoutDashboard,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  matchPrefixes?: string[];
};

export function isNavigationItemActive(
  pathname: string,
  workspaceSlug: string,
  item: NavigationItem,
) {
  return (
    pathname === item.href ||
    (item.href !== `/w/${workspaceSlug}` &&
      pathname.startsWith(`${item.href}/`)) ||
    item.matchPrefixes?.some((prefix) => pathname.startsWith(prefix)) === true
  );
}

export function getPrimaryNavigation(workspaceSlug: string): NavigationItem[] {
  const workspacePath = `/w/${workspaceSlug}`;

  return [
    {
      label: "Overview",
      href: workspacePath,
      icon: LayoutDashboard,
    },
    {
      label: "Projects",
      href: `${workspacePath}/projects`,
      icon: FolderKanban,
      matchPrefixes: [`${workspacePath}/p/`],
    },
    {
      label: "Members",
      href: `${workspacePath}/members`,
      icon: UsersRound,
    },
    {
      label: "Reports",
      href: `${workspacePath}/reports`,
      icon: BarChart3,
      disabled: true,
    },
  ];
}
