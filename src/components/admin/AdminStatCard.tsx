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
    <div className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${accentColor}`} />
      {icon && (
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--primary-600)]">{icon}</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{title}</p>
        </div>
      )}
      {!icon && (
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5" style={{ fontFamily: "var(--font-poppins)" }}>{title}</p>
      )}
      <p className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] leading-none">{value}</p>
      {subtitle && <p className="text-sm font-semibold text-[var(--muted-foreground)] mt-2">{subtitle}</p>}
    </div>
  );
}
