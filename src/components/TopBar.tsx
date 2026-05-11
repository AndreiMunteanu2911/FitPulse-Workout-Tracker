"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { apiFetch } from "@/services/api/apiFetch";
import type { Exercise } from "@/types";

/**
 * Derives a human-readable page title from the current pathname.
 *
 * Examples:
 *   "/dashboard"              -> "Dashboard"
 *   "/admin/exercises"        -> "Admin - Exercises"
 *   "/admin/users"            -> "Admin - Users"
 *   "/exercises/bench-press"  -> "Bench Press"
 *   "/history/abc123"         -> "Workout Detail"
 *   "/profile"                -> "Profile"
 *   "/login"                  -> "Log In"
 *   "/signup"                 -> "Sign Up"
 */
function getPageTitle(pathname: string): string {
  // Strip leading/trailing slashes and split
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return "FitPulse";

  const first = segments[0];
  const second = segments[1];

  // Auth routes
  if (first === "login") return "Log In";
  if (first === "signup") return "Sign Up";

  // Known page names
  const nameMap: Record<string, string> = {
    dashboard: "Dashboard",
    history: "History",
    workout: "Workout",
    exercises: "Exercises",
    profile: "Profile",
    "ai-coach": "AI Coach",
    admin: "Admin",
    achievements: "Achievements",
  };

  // Admin sub-pages
  if (first === "admin") {
    if (second && nameMap[second]) {
      return `Admin - ${nameMap[second]}`;
    }
    return "Admin";
  }

  // Nested routes (e.g. /exercises/bench-press, /history/uuid)
  if (second) {
    // If the first segment is a known section, show section + detail
    const sectionName = nameMap[first];
    if (sectionName) {
      // For exercise detail, try to beautify the slug
      if (first === "exercises") {
        return decodeURIComponent(second)
          .split(/[-_]/)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
      }
      // For workout detail / other nested routes
      return `${sectionName} Detail`;
    }
    return decodeURIComponent(second)
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }

  // Top-level known page
  if (nameMap[first]) return nameMap[first];

  // Fallback: beautify the segment
  return decodeURIComponent(first)
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function beautifySegment(segment: string): string {
  return decodeURIComponent(segment)
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function TopBar() {
  const pathname = usePathname();
  const [exerciseTitle, setExerciseTitle] = useState<string | null>(null);

  useEffect(() => {
    const match = pathname.match(/^\/exercises\/([^/]+)$/);
    if (!match) {
      setExerciseTitle(null);
      return;
    }

    const exerciseId = match[1];
    let cancelled = false;

    const loadExerciseTitle = async () => {
      try {
        const data = await apiFetch<{ exercise?: Exercise }>(`/api/exercises/${exerciseId}`);
        const nextTitle =
          typeof data.exercise?.name === "string" && data.exercise.name.trim()
            ? beautifySegment(data.exercise.name)
            : beautifySegment(exerciseId);

        if (!cancelled) {
          setExerciseTitle(nextTitle);
        }
      } catch {
        if (!cancelled) {
          setExerciseTitle(beautifySegment(exerciseId));
        }
      }
    };

    void loadExerciseTitle();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const title = exerciseTitle ?? getPageTitle(pathname);

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-11 items-center justify-between bg-gradient-to-r from-[#5E3FDE]/95 via-[#7457F5]/95 to-[#896CFE]/95 px-5 shadow-[0_10px_28px_rgba(94,63,222,0.22)] backdrop-blur-xl md:hidden">
      <span className="text-lg font-bold text-white tracking-tight truncate flex-1" style={{ fontFamily: "var(--font-poppins)" }}>{title}</span>
      <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden">
        <Image src="/assets/logo.png" alt="FitPulse" width={20} height={20} className="object-contain" />
      </div>
    </header>
  );
}
