import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const trendColors: Record<string, string> = {
    up: "text-green-600",
    down: "text-red-600",
    neutral: "text-gray-600",
  };

  return (
    <div className="bg-[var(--surface)] rounded-lg p-4 md:p-6 shadow-sm border-2 border-[var(--primary-600)] dark:border-[var(--primary-500)] hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-[var(--muted-foreground)] mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-bold text-[var(--foreground)]">{value}</p>
          {subtitle && (
            <p className={"text-xs mt-1 " + trendColors[trend || "neutral"]}>{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-[var(--primary-600)] dark:text-[var(--primary-400)] bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/30 p-2 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
