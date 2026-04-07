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
    <div className="bg-[var(--surface)] rounded-[var(--radius-md)] p-5 relative overflow-hidden">
      <div className={`absolute left-0 inset-y-0 w-1 ${accentColor}`} />
      {icon && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[var(--muted-foreground)]">{icon}</span>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{title}</p>
        </div>
      )}
      {!icon && (
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5" style={{ fontFamily: "var(--font-poppins)" }}>{title}</p>
      )}
      <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] leading-none">{value}</p>
      {subtitle && <p className="text-xs text-[var(--muted-foreground)] mt-1">{subtitle}</p>}
    </div>
  );
}
