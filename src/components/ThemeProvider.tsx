"use client";

import { useEffect } from "react";
import { persistNativeTheme, syncStatusBar } from "@/lib/mobile";
import { useThemeStore } from "@/stores/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    void persistNativeTheme(isDark);
    void syncStatusBar(isDark);
  }, [isDark]);

  return <>{children}</>;
}
