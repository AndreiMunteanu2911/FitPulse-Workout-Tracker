"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { type LucideIcon } from "lucide-react";
import { getDashboardShortcutItems } from "@/lib/navigation";

type ShortcutMeta = {
  description: string;
  color: string;
};

const shortcutMeta: Record<string, ShortcutMeta> = {
  "/blog": {
    description: "Read training guides and updates.",
    color: "from-[var(--primary-500)] to-[var(--primary-700)]",
  },
  "/social": {
    description: "See what the community is posting.",
    color: "from-[var(--primary-400)] to-[var(--primary-600)]",
  },
  "/shop": {
    description: "Browse products and store items.",
    color: "from-[var(--primary-600)] to-[var(--primary-800)]",
  },
  "/admin": {
    description: "Manage the platform and review reports.",
    color: "from-[var(--primary-700)] to-[var(--primary-900)]",
  },
};

type ShortcutItem = {
  name: string;
  href: string;
  Icon: LucideIcon;
};

export default function DashboardShortcuts() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setIsAdmin(Boolean(data?.user?.role === "admin")))
      .catch(() => setIsAdmin(false));
  }, []);

  const shortcuts = getDashboardShortcutItems(isAdmin);

  return (
    <div className="mb-6 bg-[var(--surface)] p-4 rounded-lg sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Shortcuts</p>
          <h2 className="mt-1 text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
            More places to go
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map(({ name, href, Icon }: ShortcutItem) => {
          const meta = shortcutMeta[href] || {
            description: "Open this section.",
            color: "from-[var(--primary-500)] to-[var(--primary-700)]",
          };

          return (
            <Link
              key={name}
              href={href}
              className="group rounded-md flex items-center gap-4 bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-raised)]"
            >
              <div className={`h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--foreground)]">{name}</p>
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{meta.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
