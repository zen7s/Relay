"use client";

import { Check, Laptop, Moon, Sun, SunMoon } from "lucide-react";
import { useTheme } from "next-themes";

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/shared/ui";

const themes = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Laptop },
] as const;

type ThemeSwitcherProps = {
  showLabel?: boolean;
};

export function ThemeSwitcher({ showLabel = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? "default" : "icon"}
          aria-label="Choose theme"
          className={showLabel ? "w-full justify-start" : undefined}
        >
          <SunMoon className="size-4" />
          {showLabel ? "Theme" : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        {themes.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onSelect={() => setTheme(value)}>
            <Icon />
            {label}
            {theme === value ? <Check className="ml-auto" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
