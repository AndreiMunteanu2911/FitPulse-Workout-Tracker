import type { WorkoutTemplate } from "@/types";
import { PenSquare, Trash2, List, Play, Dumbbell, ArrowUpRight } from "lucide-react";

interface TemplateCardProps {
  template: WorkoutTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onStart?: () => void;
}

export default function TemplateCard({ template, onEdit, onDelete, onStart }: TemplateCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exerciseCount = template.template_exercises?.length || 0;

  return (
    <div className="card-interactive group">
      <div className="p-5 sm:p-6">
        {/* Icon + Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-[var(--radius-md)] bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)] flex items-center justify-center">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--foreground)]">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0">
            <button
              onClick={onEdit}
              className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--primary-600)] dark:text-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)] transition-colors"
              aria-label="Edit template"
            >
              <PenSquare className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center text-[var(--color-destructive)] hover:bg-[var(--color-destructive-bg)] transition-colors"
              aria-label="Delete template"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-5 pt-4 border-t border-[var(--border)]">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--primary-50)] dark:bg-[var(--primary-100)] text-[var(--primary-700)] dark:text-[var(--primary-700)]">
            <List className="w-3 h-3" />
            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--muted-foreground)]">
              {template.updated_at ? formatDate(template.updated_at) : template.created_at ? formatDate(template.created_at) : ""}
            </span>
            {onStart && (
              <button
                onClick={onStart}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[var(--primary-500)] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[var(--primary-600)]"
                aria-label="Start workout from template"
              >
                <Play className="w-3 h-3" />
                Start
                <ArrowUpRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
