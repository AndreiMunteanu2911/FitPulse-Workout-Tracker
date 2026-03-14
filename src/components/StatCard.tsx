import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : null;
  const trendColor = trend === "up" ? "text-[var(--color-success)]" : trend === "down" ? "text-[var(--color-destructive)]" : "text-[var(--muted-foreground)]";

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] transition-all duration-200 relative overflow-hidden group">
      {/* Left accent bar */}
      <div className="absolute left-0 inset-y-0 w-1 bg-[var(--primary-500)] pointer-events-none" />

      <div className="relative">
        {icon && (
          <div className="mb-3 w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center text-[var(--primary-600)] dark:text-[var(--primary-700)]">
            {icon}
          </div>
        )}
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1.5">{title}</p>
        <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] leading-none tracking-tight">{value}</p>
        {subtitle && (
          <p className={`text-sm mt-2 font-medium ${trendColor}`}>
            {trendIcon && <span className="mr-0.5">{trendIcon}</span>}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
