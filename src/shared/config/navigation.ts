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
};

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
      disabled: true,
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
