import React from "react";
import Link from "next/link";

interface AdminQuickLinksProps {
  links: { href: string; label: string }[];
}

export default function AdminQuickLinks({ links }: AdminQuickLinksProps) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-xs px-2.5 py-1 rounded-full bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-600)] font-semibold hover:bg-[var(--primary-100)] dark:hover:bg-[var(--primary-200)] transition-colors"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
