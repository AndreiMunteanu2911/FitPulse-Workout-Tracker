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
      className="group block rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
    >
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-[var(--radius-lg)] ${color} flex items-center justify-center flex-shrink-0 shadow-[0_12px_26px_rgba(116,87,245,0.18)]`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="mb-1 text-lg font-extrabold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{title}</h3>
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">{description}</p>
        </div>
        <ArrowRight className="w-5 h-5 text-[var(--muted-foreground)] group-hover:translate-x-1 group-hover:text-[var(--foreground)] transition-all" />
      </div>
    </Link>
  );
}
