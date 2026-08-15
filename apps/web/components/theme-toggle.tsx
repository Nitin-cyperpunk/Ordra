"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: {
  value: ThemePreference;
  label: string;
  icon: typeof Sun;
}[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

type ThemeToggleProps = {
  className?: string;
};

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { preference, setPreference, ready } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "border-input bg-background inline-flex items-center rounded-md border p-0.5 print:hidden",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = preference === value;
        return (
          <button
            key={value}
            type="button"
            disabled={!ready}
            aria-label={`${label} theme`}
            aria-pressed={selected}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-sm transition-colors",
              "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-1",
              "disabled:pointer-events-none disabled:opacity-50",
              selected
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
