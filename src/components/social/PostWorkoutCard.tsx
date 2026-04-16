interface PostWorkoutCardProps {
  workoutSummary: string;
}

export default function PostWorkoutCard({ workoutSummary }: PostWorkoutCardProps) {
  const lines = workoutSummary.split("\n");
  const title = lines[0];
  const exerciseLines = lines.slice(1).filter((l) => !l.startsWith("📊"));
  const volumeLine = lines.find((l) => l.startsWith("📊"));

  return (
    <div className="mt-3 rounded-[var(--radius-md)] bg-gradient-to-br from-[var(--primary-500)]/5 to-[var(--lime-green)]/5 border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary-500)]/10 to-transparent border-b border-[var(--border)]">
        <h3 className="text-sm font-bold text-[var(--foreground)]">{title}</h3>
      </div>

      <div className="px-4 py-3 space-y-1.5">
        {exerciseLines.map((line, i) => {
          const cleanLine = line.replace(/^[•\-]\s*/, "");
          const parts = cleanLine.split(/\s{2,}/);
          const name = parts[0] || cleanLine;
          const sets = parts[1] || "";

          return (
            <div key={i} className="flex items-baseline justify-between text-xs">
              <span className="text-[var(--muted-foreground)] truncate flex-1 mr-2">{name}</span>
              {sets && (
                <span className="text-[var(--primary-600)] dark:text-[var(--primary-400)] font-semibold whitespace-nowrap">
                  {sets}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {volumeLine && (
        <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--surface-raised)]">
          <p className="text-xs font-semibold text-[var(--foreground)]">{volumeLine}</p>
        </div>
      )}
    </div>
  );
}
