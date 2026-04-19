interface PostWorkoutCardProps {
  workoutSummary: string;
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function PostWorkoutCard({ workoutSummary }: PostWorkoutCardProps) {
  const lines = workoutSummary.split("\n");
  const title = lines[0].replace(/^🏋️\s*/, "");
  const exerciseLines = lines.slice(1).filter((l) => !l.startsWith("📊"));

  return (
    <div className="mt-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] overflow-hidden">
      <div className="px-4 py-2.5 bg-gradient-to-r from-[var(--primary-500)] to-[var(--primary-400)]">
        <h3 className="text-sm font-bold text-white">{capitalize(title)}</h3>
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
    </div>
  );
}
