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
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] p-5 sm:p-6 transition-all duration-200 relative overflow-hidden group">
      {/* Circular icon badge */}
      {icon && (
        <div className="absolute -top-2 -right-2 w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center transition-shadow">
          <div className="text-white">
            {icon}
          </div>
        </div>
      )}

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2" style={{ fontFamily: "var(--font-poppins)" }}>{title}</p>
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
