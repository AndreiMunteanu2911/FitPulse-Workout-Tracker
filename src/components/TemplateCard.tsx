import type { WorkoutTemplate } from "@/types";
import { PenSquare, Trash2, List, Play, Dumbbell } from "lucide-react";

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
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] transition-all duration-200 group overflow-hidden">
      <div className="p-5">
        {/* Icon + Header row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] flex items-center justify-center">
            <Dumbbell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--foreground)] truncate" style={{ fontFamily: "var(--font-poppins)" }}>{template.name}</h3>
            {template.description && (
              <p className="text-sm text-[var(--muted-foreground)] mt-0.5 line-clamp-2">
                {template.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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

        <div className="flex items-center justify-between mt-3 pt-3">
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
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary-500)] hover:bg-[var(--primary-600)] text-white transition-colors"
                aria-label="Start workout from template"
              >
                <Play className="w-3 h-3" />
                Start
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
