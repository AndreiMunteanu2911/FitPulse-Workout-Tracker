import React from "react";
import Link from "next/link";

interface AdminQuickLinksProps {
  links: { href: string; label: string }[];
}

export default function AdminQuickLinks({ links }: AdminQuickLinksProps) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-full bg-[var(--primary-50)] px-3 py-1.5 text-xs font-bold text-[var(--primary-700)] transition-colors hover:bg-[var(--primary-100)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-600)]"
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
