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
      className="bg-[var(--surface)] rounded-[var(--radius-xl)] p-5 shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[var(--foreground)] mb-0.5">{title}</h3>
          <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-[var(--muted-foreground)] group-hover:translate-x-1 group-hover:text-[var(--foreground)] transition-all" />
      </div>
    </Link>
  );
}
