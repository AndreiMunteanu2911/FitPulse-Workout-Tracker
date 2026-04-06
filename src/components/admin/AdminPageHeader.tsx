import React from "react";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

interface AdminPageHeaderProps {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
  backHref?: string;
}

/**
 * Standard page header for admin pages.
 * Matches the existing back button style used in /exercises/[id].
 */
export default function AdminPageHeader({ title, subtitle, action, backHref }: AdminPageHeaderProps) {
  return (
    <div className="page-header mb-4 flex items-center gap-3" style={{ top: 0 }}>
      {backHref && (
        <Link
          href={backHref}
          className="w-9 h-9 rounded-[var(--radius-lg)] flex items-center justify-center bg-[var(--surface)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow)] transition-shadow flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 text-[var(--foreground)]" />
        </Link>
      )}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--foreground)] truncate">{title}</h1>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="ml-auto flex-shrink-0">{action}</div>}
    </div>
  );
}
