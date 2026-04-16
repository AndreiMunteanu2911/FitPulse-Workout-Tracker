// ── FormHistoryPanel ─────────────────────────────────────────────────────────
// Shows recent form-check sessions for an exercise, fetched from /api/form-logs.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import Skeleton from "react-loading-skeleton";

interface FormLog {
  id: string;
  score: number;
  reps: number;
  duration_ms: number;
  created_at: string;
}

interface FormHistoryPanelProps {
  exerciseId: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "—";
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec}s`;
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return sec > 0 ? `${min}m ${sec}s` : `${min}m`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
      : score >= 60
      ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
      : "bg-red-500/15 text-red-600 dark:text-red-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${color}`}>
      {score}%
    </span>
  );
}

export default function FormHistoryPanel({ exerciseId }: FormHistoryPanelProps) {
  const [logs, setLogs] = useState<FormLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/form-logs?exerciseId=${encodeURIComponent(exerciseId)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={52} className="rounded-lg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-3 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" />
        Recent Form Sessions
      </h2>
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex items-center justify-between px-4 py-3 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)]"
          >
            <div className="flex items-center gap-3">
              <ScoreBadge score={log.score} />
              <div>
                <p className="text-xs text-[var(--muted-foreground)]">{formatDate(log.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
              {log.reps > 0 && (
                <span className="font-medium text-[var(--foreground)]">{log.reps} reps</span>
              )}
              <span>{formatDuration(log.duration_ms)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
