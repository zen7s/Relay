"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/shared/lib";

const themes = [
  {
    value: "light",
    label: "Light",
    description: "Always use light mode",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Dark",
    description: "Always use dark mode",
    icon: Moon,
  },
  {
    value: "system",
    label: "System",
    description: "Match your device",
    icon: Laptop,
  },
] as const;

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  const selectedTheme = mounted ? theme : undefined;

  return (
    <div
      className="grid gap-3 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Theme"
    >
      {themes.map(({ value, label, description, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={selectedTheme === value}
          onClick={() => setTheme(value)}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors hover:bg-accent",
            selectedTheme === value &&
              "border-primary bg-primary/5 ring-1 ring-primary",
          )}
        >
          <Icon className="mb-3 size-5" />
          <span className="block text-sm font-medium">{label}</span>
          <span className="mt-1 block text-xs text-muted-foreground">
            {description}
          </span>
        </button>
      ))}
    </div>
  );
}
