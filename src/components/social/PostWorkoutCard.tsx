import { Dumbbell } from "lucide-react";

interface PostWorkoutCardProps {
  workoutSummary: string;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PostWorkoutCard({ workoutSummary }: PostWorkoutCardProps) {
  const lines = workoutSummary.split("\n").filter(Boolean);
  const title = lines[0].replace(/^[^a-zA-Z0-9]+/, "");
  const exerciseLines = lines.slice(1).filter((line) => !line.toLowerCase().includes("total volume"));

  return (
    <div className="relative mt-4 overflow-hidden rounded-[var(--radius-xl)] border border-[var(--primary-200)]/60 bg-[var(--surface-raised)] p-4">
      <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[var(--primary-500)] to-[var(--lime-green)]" />
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-600)] text-white shadow-[0_8px_20px_rgba(116,87,245,0.2)]">
          <Dumbbell className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--primary-600)]">Workout</p>
          <h3 className="truncate text-sm font-bold text-[var(--foreground)]">{capitalize(title)}</h3>
        </div>
      </div>

      {exerciseLines.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-[var(--border)] pt-3">
          {exerciseLines.slice(0, 5).map((line, index) => {
            const cleanLine = line.replace(/^[^a-zA-Z0-9]+/, "");
            const parts = cleanLine.split(/\s{2,}/);
            return (
              <div key={`${cleanLine}-${index}`} className="flex items-center justify-between gap-3 text-xs">
                <span className="min-w-0 flex-1 truncate text-[var(--muted-foreground)]">{parts[0] || cleanLine}</span>
                {parts[1] && <span className="shrink-0 font-semibold text-[var(--primary-600)]">{parts[1]}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
