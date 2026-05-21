import React from "react";

interface StatCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : null;
  const trendColor = trend === "up" ? "text-[var(--color-success)]" : trend === "down" ? "text-[var(--color-destructive)]" : "text-[var(--muted-foreground)]";

  return (
    <div className="group relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)]" />
      {/* Circular icon badge */}
      {icon && (
        <div className="absolute -top-2 -right-2 w-16 h-16 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center transition-shadow shadow-[0_12px_28px_rgba(116,87,245,0.24)]">
          <div className="text-white">
            {icon}
          </div>
        </div>
      )}

      <div className="relative">
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)] mb-3" style={{ fontFamily: "var(--font-poppins)" }}>{title}</p>
        <p className="text-3xl sm:text-4xl font-extrabold text-[var(--foreground)] leading-none tracking-tight">{value}</p>
        {subtitle && (
          <p className={`text-sm mt-3 font-medium ${trendColor}`}>
            {trendIcon && <span className="mr-0.5">{trendIcon}</span>}
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
