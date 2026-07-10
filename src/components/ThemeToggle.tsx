"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isNight = resolvedTheme === "night";
  const label = isNight ? "Switch to day theme" : "Switch to night theme";

  return (
    <button
      aria-label={label}
      aria-pressed={isNight}
      className={`theme-toggle ${isNight ? "night" : "day"} ${className}`.trim()}
      suppressHydrationWarning
      title={label}
      type="button"
      onClick={toggleTheme}
    >
      <Sun className="theme-toggle-sun" size={16} aria-hidden />
      <span className="theme-toggle-track" aria-hidden>
        <span />
      </span>
      <Moon className="theme-toggle-moon" size={16} aria-hidden />
      <span className="sr-only">Toggle color theme</span>
    </button>
  );
}
