import type { WorkoutTemplate } from "@/types";
import { PenSquare, Trash2, List } from "lucide-react";

interface TemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exerciseCount = template.template_exercises?.length || 0;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 group overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)]" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[var(--foreground)] truncate">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--primary-600)] dark:text-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)] transition-colors"
              aria-label="Edit template"
            >
              <PenSquare className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-[var(--color-destructive)] hover:bg-[var(--color-destructive-bg)] transition-colors"
              aria-label="Delete template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border)]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
            <List className="w-3 h-3" />
            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {template.updated_at ? formatDate(template.updated_at) : template.created_at ? formatDate(template.created_at) : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
