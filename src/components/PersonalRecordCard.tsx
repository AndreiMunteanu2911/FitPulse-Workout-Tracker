interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  max_weight: number;
  max_reps: number;
  workout_date: string;
  created_at: string;
  updated_at: string;
  exercise?: {
    exercise_id: string;
    name: string;
    gif_url?: string;
    target_muscles?: string[];
    body_parts?: string[];
  };
}

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

  return (
    <div className="bg-[var(--surface)] border-2 border-[var(--primary-600)] dark:border-[var(--primary-500)] rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-[var(--foreground)]">{exerciseName}</h3>
          <p className="text-sm text-[var(--muted-foreground)] capitalize">{targetMuscles}</p>
        </div>
        {record.exercise?.gif_url && (
          <img
            src={record.exercise.gif_url}
            alt={exerciseName}
            className="w-16 h-16 object-contain rounded"
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/40 rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">Max Weight</p>
          <p className="text-xl font-bold text-[var(--primary-600)] dark:text-[var(--primary-300)]">
            {record.max_weight > 0 ? `${record.max_weight} kg` : "--"}
          </p>
        </div>
        <div className="bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/40 rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">Max Reps</p>
          <p className="text-xl font-bold text-[var(--primary-600)] dark:text-[var(--primary-300)]">
            {record.max_reps > 0 ? record.max_reps : "--"}
          </p>
        </div>
        <div className="bg-[var(--primary-50)] dark:bg-[var(--primary-900)]/40 rounded-lg p-3">
          <p className="text-xs text-[var(--muted-foreground)]">Date</p>
          <p className="text-sm font-semibold text-[var(--primary-600)] dark:text-[var(--primary-300)]">
            {formatDate(record.workout_date)}
          </p>
        </div>
      </div>

      {record.max_weight > 0 && record.max_reps > 0 && (
        <div className="mt-3 text-center text-sm text-[var(--muted-foreground)]">
          Est. 1RM: <span className="font-semibold text-[var(--primary-600)] dark:text-[var(--primary-400)]">{Math.round(record.max_weight * (1 + record.max_reps / 30))} kg</span>
        </div>
      )}
    </div>
  );
}
