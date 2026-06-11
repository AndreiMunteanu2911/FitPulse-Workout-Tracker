import React from "react";

interface AdminStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accentColor?: string;
}

/**
 * Stat card with a customizable left accent bar.
 * Uses the app's primary color scale for accents.
 *
 * @param accentColor - CSS var class for the accent bar (e.g. "bg-[var(--primary-500)]")
 */
export default function AdminStatCard({ title, value, subtitle, icon, accentColor = "bg-[var(--primary-500)]" }: AdminStatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] ring-1 ring-[var(--border)] sm:p-5">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentColor}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{title}</p>
          <p className="mt-3 text-2xl font-extrabold leading-none tracking-[-0.04em] text-[var(--foreground)] sm:text-3xl">{value}</p>
        </div>
        {icon && <span className="icon-tile !size-10">{icon}</span>}
      </div>
      {subtitle && <p className="mt-3 text-xs font-semibold text-[var(--muted-foreground)]">{subtitle}</p>}
    </div>
  );
}
