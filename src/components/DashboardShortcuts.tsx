"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { useAuthSession } from "@/components/AuthSessionProvider";
import { getDashboardShortcutItems } from "@/lib/navigation";

type ShortcutMeta = {
  description: string;
};

const shortcutMeta: Record<string, ShortcutMeta> = {
  "/blog": {
    description: "Read training guides and updates.",
  },
  "/social": {
    description: "See what the community is posting.",
  },
  "/shop": {
    description: "Browse products and store items.",
  },
  "/admin": {
    description: "Manage the platform and review reports.",
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
    <div className="card p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Explore</p>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            More from FitPulse
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shortcuts.map(({ name, href, Icon }: ShortcutItem) => {
          const meta = shortcutMeta[href] || {
            description: "Open this section.",
          };

          return (
            <Link
              key={name}
              href={href}
              className="group flex items-center gap-4 rounded-[var(--radius-lg)] border border-transparent bg-[var(--surface-raised)] p-4 transition-colors hover:border-[var(--border)] hover:bg-[var(--surface)]"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold text-[var(--foreground)]">{name}</p>
                <p className="mt-1 text-sm leading-snug text-[var(--muted-foreground)]">{meta.description}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
