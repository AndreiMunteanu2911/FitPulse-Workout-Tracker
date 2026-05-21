"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { useAuthSession } from "@/components/AuthSessionProvider";
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
  const { isAdmin } = useAuthSession();

  const shortcuts = getDashboardShortcutItems(isAdmin);

  return (
    <div className="card mb-6 p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Shortcuts</p>
          <h2 className="mt-1 text-xl font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
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
              className="group flex items-center gap-4 rounded-[var(--radius-xl)] bg-[var(--surface-raised)] p-4 transition-all hover:-translate-y-0.5 hover:bg-[var(--surface)] hover:shadow-[var(--shadow-sm)]"
            >
              <div className={`h-14 w-14 flex-shrink-0 rounded-[var(--radius-lg)] bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-[0_12px_26px_rgba(116,87,245,0.18)]`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{name}</p>
                <p className="mt-1 text-sm leading-snug text-[var(--muted-foreground)]">{meta.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
