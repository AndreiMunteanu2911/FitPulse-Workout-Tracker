import type { PersonalRecord } from "@/types";
import { Trophy } from "lucide-react";

interface PersonalRecordCardProps {
  record: PersonalRecord;
}

export default function PersonalRecordCard({ record }: PersonalRecordCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const exerciseName = record.exercise?.name || "Unknown Exercise";
  const targetMuscles = record.exercise?.target_muscles?.[0] || "Unknown";
  const estimated1RM = record.max_weight > 0 && record.max_reps > 0
    ? Math.round(record.max_weight * (1 + record.max_reps / 30))
    : null;

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-lg)] overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-[var(--primary-500)] to-[var(--lime-green)] flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-[var(--foreground)] capitalize truncate" style={{ fontFamily: "var(--font-poppins)" }}>{exerciseName}</h3>
              <p className="text-xs text-[var(--muted-foreground)] capitalize mt-0.5">{targetMuscles}</p>
            </div>
          </div>
          {record.exercise?.gif_url && (
            <img
              src={record.exercise.gif_url}
              alt={exerciseName}
              className="w-14 h-14 object-contain rounded-[var(--radius-sm)] bg-[var(--surface-raised)] ml-3 flex-shrink-0"
            />
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="stat-block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Max Weight</p>
            <p className="text-xl font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-500)] leading-none">
              {record.max_weight > 0 ? record.max_weight : "—"}
            </p>
            {record.max_weight > 0 && <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">kg</p>}
          </div>
          <div className="stat-block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Max Reps</p>
            <p className="text-xl font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-500)] leading-none">
              {record.max_reps > 0 ? record.max_reps : "—"}
            </p>
            {record.max_reps > 0 && <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">reps</p>}
          </div>
          <div className="stat-block">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">Date</p>
            <p className="text-sm font-bold text-[var(--foreground)] leading-tight">
              {formatDate(record.workout_date)}
            </p>
          </div>
        </div>

        {estimated1RM !== null && (
          <div className="mt-3 flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-[var(--primary-50)] dark:bg-[color-mix(in_srgb,var(--primary-900)_40%,transparent)]">
            <span className="text-sm text-[var(--muted-foreground)]">Est. 1RM</span>
            <span className="text-base font-extrabold text-[var(--primary-600)] dark:text-[var(--primary-500)]">{estimated1RM} kg</span>
          </div>
        )}
      </div>
    </div>
  );
}
