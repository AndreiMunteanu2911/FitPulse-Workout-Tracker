"use client";

import { useThemeStore } from "@/stores/themeStore";
import { useEffect } from "react";
import { Sun, Moon } from "lucide-react";

export default function DarkModeToggle() {
  const { isDark, toggle } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-md bg-[var(--surface)] hover:bg-[var(--surface)]/80 transition"
      aria-label="Toggle dark mode"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-[var(--primary-400)]" />
      ) : (
        <Moon className="w-5 h-5 text-[var(--foreground)]" />
      )}
    </button>
  );
}
