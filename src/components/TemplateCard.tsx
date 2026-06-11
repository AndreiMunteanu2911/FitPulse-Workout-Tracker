import type { WorkoutTemplate } from "@/types";
import { CalendarDays, List, PenSquare, Play, Trash2 } from "lucide-react";
import Button from "@/components/Button";

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
    <article className="card group relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--primary-500)] to-[var(--lime-green)]" />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="eyebrow !mb-1">Workout template</p>
            <h3 className="truncate text-lg font-bold tracking-[-0.025em] text-[var(--foreground)]">{template.name}</h3>
            {template.description && (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">
                {template.description}
              </p>
            )}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={onEdit}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
              aria-label="Edit template"
            >
              <PenSquare className="size-3.5" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold text-[var(--muted-foreground)] transition-colors hover:bg-[var(--color-destructive-bg)] hover:text-[var(--color-destructive)]"
              aria-label="Delete template"
            >
              <Trash2 className="size-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="badge badge-soft">
            <List className="size-3.5" />
            {exerciseCount} {exerciseCount === 1 ? "exercise" : "exercises"}
          </span>
          {(template.updated_at || template.created_at) && (
            <span className="badge border border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
              <CalendarDays className="size-3.5" />
              {template.updated_at ? formatDate(template.updated_at) : template.created_at ? formatDate(template.created_at) : ""}
            </span>
          )}
        </div>

        {onStart && (
          <div className="mt-5 border-t border-[var(--border)] pt-4">
            <Button onClick={onStart} block className="text-sm sm:text-sm">
              <Play className="size-4 fill-current" />
              Start workout
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
