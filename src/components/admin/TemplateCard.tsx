import React from "react";
import { Trash2 } from "lucide-react";

interface TemplateCardProps {
  name: string;
  description: string | null;
  exerciseCount: number;
  isOfficial?: boolean;
  onDelete: () => void;
}

export default function TemplateCard({ name, description, exerciseCount, isOfficial, onDelete }: TemplateCardProps) {
  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] p-4 sm:p-5 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-bold text-[var(--foreground)]">{name}</h3>
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
        <button
          onClick={onDelete}
          className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--color-destructive-bg)] flex items-center justify-center transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4 text-[var(--muted-foreground)] hover:text-[var(--color-destructive)]" />
        </button>
      </div>
    </div>
  );
}
