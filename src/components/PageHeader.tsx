import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
}

export function PageHeader({ title, description, actions, backHref }: PageHeaderProps) {
  const hasMobileControls = Boolean(actions || backHref);

  return (
    <header className={`page-header mb-6 ${hasMobileControls ? "" : "hidden md:block"}`}>
      <div className="flex items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Go back"
            className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] shadow-[var(--shadow-xs)] transition-colors hover:text-[var(--foreground)]"
          >
            <ChevronLeft className="size-4" />
          </Link>
        ) : null}
        <div className="hidden min-w-0 flex-1 md:block">
          <h1 className="page-title">{title}</h1>
          {description ? <div className="page-description">{description}</div> : null}
        </div>
        {actions ? <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
