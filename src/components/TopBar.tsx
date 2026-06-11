"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/services/api/apiFetch";
import type { BlogPost, Exercise } from "@/types";
import { AppLogo } from "@/components/AppLogo";

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
    analytics: "Analytics",
    blog: "Blog",
    "checkout-success": "Checkout",
    "form-rules": "Form Rules",
    orders: "Orders",
    shop: "Shop",
    social: "Social",
    templates: "Templates",
    users: "Users",
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
  const [routeTitle, setRouteTitle] = useState<string | null>(null);

  useEffect(() => {
    const exerciseMatch = pathname.match(/^\/exercises\/([^/]+)$/);
    const blogMatch = pathname.match(/^\/blog\/([^/]+)$/);

    if (!exerciseMatch && !blogMatch) {
      setRouteTitle(null);
      return;
    }

    setRouteTitle(null);
    let cancelled = false;

    const loadRouteTitle = async () => {
      try {
        if (exerciseMatch) {
          const exerciseId = exerciseMatch[1];
          const data = await apiFetch<{ exercise?: Exercise }>(`/api/exercises/${exerciseId}`);
          const nextTitle =
            typeof data.exercise?.name === "string" && data.exercise.name.trim()
              ? beautifySegment(data.exercise.name)
              : beautifySegment(exerciseId);

          if (!cancelled) {
            setRouteTitle(nextTitle);
          }
          return;
        }

        if (blogMatch) {
          const blogId = blogMatch[1];
          const data = await apiFetch<{ data?: BlogPost }>(`/api/blog/${blogId}`);
          const nextTitle =
            typeof data.data?.title === "string" && data.data.title.trim()
              ? data.data.title.trim()
              : "Blog Post";

          if (!cancelled) {
            setRouteTitle(nextTitle);
          }
        }
      } catch {
        if (!cancelled) {
          setRouteTitle(blogMatch ? "Blog Post" : getPageTitle(pathname));
        }
      }
    };

    void loadRouteTitle();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const title = routeTitle ?? getPageTitle(pathname);

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-[var(--ph-top)] items-end justify-between bg-gradient-to-r from-[#5E3FDE]/95 via-[#7457F5]/95 to-[#896CFE]/95 px-4 pb-2.5 shadow-[0_10px_28px_rgba(94,63,222,0.22)] backdrop-blur-xl md:hidden">
      <span className="min-w-0 flex-1 truncate text-base font-semibold tracking-tight text-white">{title}</span>
      <AppLogo compact />
    </header>
  );
}
