"use client";

import { useEffect, useState } from "react";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import type { FormLog } from "@/types";

interface FormHistoryPanelProps {
  exerciseId: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "-";
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
  return (
    <span className="inline-flex items-center rounded-full bg-[var(--primary-50)] px-2.5 py-1 text-sm font-bold text-[var(--primary-700)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
      {score}%
    </span>
  );
}

export default function FormHistoryPanel({ exerciseId }: FormHistoryPanelProps) {
  const [logs, setLogs] = useState<FormLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);

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
    void load();
  }, [exerciseId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={84} className="rounded-lg" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        <Activity className="h-3.5 w-3.5" />
        Recent Form Sessions
      </h2>
      <div className="space-y-2.5">
        {logs.map((log) => {
          const isExpanded = expandedLogIds.includes(log.id);
          const coaching = log.feedback_json.coaching;
          const coachingTopCues = coaching?.top_cues ?? [];
          const coachingObservations = coaching?.rep_observations ?? [];
          const hasDetails = Boolean(
            coaching
            || log.feedback_summary
            || (log.feedback_json.topIssues?.length ?? 0) > 0,
          );

          return (
            <div
              key={log.id}
              className="rounded-[var(--radius-lg)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-xs)]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <ScoreBadge score={log.score} />
                  <p className="text-xs text-[var(--muted-foreground)]">{formatDate(log.created_at)}</p>
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--muted-foreground)]">
                  {log.reps > 0 && (
                    <p className="font-semibold text-[var(--foreground)]">{log.reps} reps</p>
                  )}
                  <p>{formatDuration(log.duration_ms)}</p>
                </div>

                {log.feedback_summary && (
                  <p className={`mt-1.5 text-[15px] leading-snug text-[var(--foreground)] ${isExpanded ? "" : "line-clamp-2"}`}>
                    {log.feedback_summary}
                  </p>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[var(--muted-foreground)]">
                  Realtime {log.realtime_score}%
                </span>
                <span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[var(--muted-foreground)]">
                  Post-set {log.postset_score}%
                </span>
                <span className="rounded-full bg-[var(--surface-raised)] px-2.5 py-1 text-[var(--muted-foreground)]">
                  {log.analysis_status === "cloud_complete"
                    ? "Coach review ready"
                    : log.analysis_status === "cloud_failed"
                      ? "Coach unavailable"
                      : "Local summary"}
                </span>
              </div>

              {hasDetails && (
                <div className="mt-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setExpandedLogIds((current) => (
                      current.includes(log.id)
                        ? current.filter((id) => id !== log.id)
                        : [...current, log.id]
                    ))}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--primary-600)] transition-colors hover:text-[var(--primary-700)]"
                  >
                    {isExpanded ? "Hide full review" : "Show full review"}
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 space-y-3 rounded-[var(--radius-md)] bg-[var(--surface-raised)] p-3">
                      {coaching?.summary && (
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Coach Summary</p>
                          <p className="text-[15px] leading-snug text-[var(--foreground)]">{coaching.summary}</p>
                        </div>
                      )}

                      {coachingTopCues.length > 0 && (
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Top Cues</p>
                          <div className="space-y-1.5">
                            {coachingTopCues.map((cue, index) => (
                              <p key={`${log.id}-cue-${index}`} className="text-[15px] leading-snug text-[var(--foreground)]">
                                - {cue}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {coachingObservations.length > 0 && (
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Rep Notes</p>
                          <div className="space-y-1.5">
                            {coachingObservations.map((observation, index) => (
                              <p key={`${log.id}-observation-${index}`} className="text-[15px] leading-snug text-[var(--foreground)]">
                                - {observation}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {!coaching && log.feedback_summary && (
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">Session Notes</p>
                          <p className="text-[15px] leading-snug text-[var(--foreground)]">{log.feedback_summary}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
