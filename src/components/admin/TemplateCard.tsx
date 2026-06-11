import React from "react";
import { Trash2 } from "lucide-react";
import Button from "@/components/Button";

interface TemplateCardProps {
  name: string;
  description: string | null;
  exerciseCount: number;
  isOfficial?: boolean;
  onDelete: () => void;
}

export default function TemplateCard({ name, description, exerciseCount, isOfficial, onDelete }: TemplateCardProps) {
  return (
    <div className="rounded-[var(--radius-xl)] bg-[var(--surface)] p-4 shadow-[var(--shadow-xs)] ring-1 ring-[var(--border)] transition-all duration-200 hover:ring-[var(--primary-200)] sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>{name}</h3>
            {isOfficial && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary-500)] text-white">
                Official
              </span>
            )}
          </div>
          {description && <p className="text-sm text-[var(--muted-foreground)] mb-2">{description}</p>}
          <p className="text-xs text-[var(--muted-foreground)]">
            {exerciseCount} exercise{exerciseCount !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={onDelete}
          className="flex-shrink-0 !px-3 text-[var(--color-destructive)]"
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
