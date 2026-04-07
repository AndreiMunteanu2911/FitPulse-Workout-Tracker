import React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="text-center py-12 bg-[var(--surface)] rounded-[var(--radius-lg)]">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-[var(--foreground)] mb-2" style={{ fontFamily: "var(--font-poppins)" }}>{title}</h3>
      <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      {children}
    </div>
  );
}
