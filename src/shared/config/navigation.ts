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
  active?: boolean;
};

export const primaryNavigation: NavigationItem[] = [
  {
    label: "Overview",
    href: "/",
    icon: LayoutDashboard,
    active: true,
  },
  {
    label: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  {
    label: "Team",
    href: "/team",
    icon: UsersRound,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];
