import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  trend?: "up" | "down" | "neutral";
}

export default function StatCard({ title, value, subtitle, icon, trend }: StatCardProps) {
  const trendIcon = trend === "up" ? "+" : trend === "down" ? "-" : null;
  const trendColor =
    trend === "up"
      ? "text-[var(--color-success)]"
      : trend === "down"
        ? "text-[var(--color-destructive)]"
        : "text-[var(--muted-foreground)]";

  return (
    <div className="card relative p-5 sm:p-6">
      {icon ? (
        <div className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
          {icon}
        </div>
      ) : null}

      <p className="mb-3 pr-10 text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{title}</p>
      <p className="text-3xl font-semibold leading-none tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">{value}</p>
      {subtitle ? (
        <p className={`mt-3 text-sm font-medium ${trendColor}`}>
          {trendIcon ? <span className="mr-1">{trendIcon}</span> : null}
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
