"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";

/**
 * Derives a human-readable page title from the current pathname.
 *
 * Examples:
 *   "/dashboard"              → "Dashboard"
 *   "/admin/exercises"        → "Admin — Exercises"
 *   "/admin/users"            → "Admin — Users"
 *   "/exercises/bench-press"  → "Bench Press"
 *   "/history/abc123"         → "Workout Detail"
 *   "/profile"                → "Profile"
 *   "/login"                  → "Log In"
 *   "/signup"                 → "Sign Up"
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
      return `Admin — ${nameMap[second]}`;
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

export default function TopBar() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="fixed top-0 left-0 right-0 z-20 md:hidden h-11 flex items-center justify-between px-4 bg-gradient-to-r from-[#1e3a8a] to-[#1d4ed8] shadow-[0_1px_6px_rgba(0,0,0,0.25)]">
      <span className="text-lg font-bold text-white tracking-tight truncate">{title}</span>
      <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
        <Image src="/assets/dumbbell-large.svg" alt="FitPulse" width={18} height={18} className="brightness-0 invert" />
      </div>
    </header>
  );
}
