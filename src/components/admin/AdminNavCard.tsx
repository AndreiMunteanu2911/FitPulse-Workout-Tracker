import React from "react";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface AdminNavCardProps {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export default function AdminNavCard({ href, title, description, icon: Icon, color }: AdminNavCardProps) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] p-5 shadow-[var(--shadow-xs)] ring-1 ring-[var(--border)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)] hover:ring-[var(--primary-200)]"
    >
      <div className="absolute -right-12 -top-16 size-36 rounded-full bg-[var(--primary-50)] opacity-70 blur-3xl" />
      <div className="relative flex items-center gap-4">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-[var(--radius-lg)] shadow-[0_10px_22px_rgba(116,87,245,0.18)] ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 text-base font-bold text-[var(--foreground)]">{title}</h3>
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--primary-600)] transition-all group-hover:translate-x-1 group-hover:bg-[var(--primary-50)]">
          <ArrowRight className="size-4" />
        </span>
      </div>
    </Link>
  );
}
