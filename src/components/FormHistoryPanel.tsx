"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, ChevronDown, ChevronUp, Clock, Sparkles, Target, Zap } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import type { FormLog } from "@/types";
import { getScoreBand } from "@/lib/form-analysis";

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

function ScoreSummary({ score }: { score: number }) {
  const band = getScoreBand(score);
  return (
    <div className="flex min-h-24 flex-col justify-between rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--primary-500)] to-[var(--primary-700)] p-4 text-white shadow-[0_12px_28px_rgba(116,87,245,0.22)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-white/70">{band.label} form</p>
      <div className="mt-3 flex items-end gap-1">
        <span className="text-4xl font-extrabold leading-none">{score}</span>
        <span className="pb-1 text-lg font-extrabold leading-none text-white/80">%</span>
      </div>
    </div>
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
      <div className="flex min-h-32 items-center justify-center">
        <LoadingSpinner size={6} />
      </div>
    );
  }

  if (logs.length === 0) return null;

  return (
    <LoadReveal className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
        <Activity className="h-3.5 w-3.5" />
        Recent Form Sessions
      </h2>
      <div className="space-y-4">
        {logs.map((log) => {
          const isExpanded = expandedLogIds.includes(log.id);
          const coaching = log.feedback_json.coaching;
          const coachingTopCues = coaching?.top_cues ?? [];
          const coachingObservations = coaching?.rep_observations ?? [];
          const topIssues = log.feedback_json.topIssues ?? [];
          const statusLabel = log.analysis_status === "cloud_complete"
            ? "Coach review ready"
            : log.analysis_status === "cloud_failed"
              ? "Coach unavailable"
              : "Local summary";
          const metricItems = [
            {
              label: "Realtime",
              value: `${log.realtime_score}%`,
              icon: <Zap className="h-4 w-4" />,
            },
            {
              label: "Post-set",
              value: `${log.postset_score}%`,
              icon: <Target className="h-4 w-4" />,
            },
            {
              label: "Reps",
              value: log.reps > 0 ? log.reps : "-",
              icon: <Activity className="h-4 w-4" />,
            },
            {
              label: "Duration",
              value: formatDuration(log.duration_ms),
              icon: <Clock className="h-4 w-4" />,
            },
          ];
          const hasDetails = Boolean(
            coaching
            || log.feedback_summary
            || topIssues.length > 0,
          );

          return (
            <div
              key={log.id}
              className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] sm:p-5"
            >
              <div className="grid gap-4 lg:grid-cols-[12rem_1fr]">
                <ScoreSummary score={log.score} />

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
                      {formatDate(log.created_at)}
                    </p>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary-50)] px-3 py-1.5 text-xs font-bold text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                      <Sparkles className="h-3.5 w-3.5" />
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {metricItems.map((metric) => (
                      <div key={metric.label} className="rounded-[var(--radius-md)] bg-[var(--surface-raised)] p-3">
                        <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                          {metric.icon}
                        </div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">{metric.label}</p>
                        <p className="mt-1 text-xl font-extrabold leading-none text-[var(--foreground)]">{metric.value}</p>
                      </div>
                    ))}
                  </div>

                  {log.feedback_summary && (
                    <p className={`mt-4 text-base leading-relaxed text-[var(--foreground)] ${isExpanded ? "" : "line-clamp-2"}`}>
                      {log.feedback_summary}
                    </p>
                  )}
                </div>
              </div>

              {hasDetails && (
                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  <button
                    type="button"
                    onClick={() => setExpandedLogIds((current) => (
                      current.includes(log.id)
                        ? current.filter((id) => id !== log.id)
                        : [...current, log.id]
                    ))}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--surface-raised)] px-4 py-2 text-sm font-bold text-[var(--primary-600)] transition-colors hover:bg-[var(--primary-50)] hover:text-[var(--primary-700)] dark:hover:bg-[var(--primary-100)]"
                  >
                    {isExpanded ? "Hide full review" : "Show full review"}
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      className="mt-4 grid gap-3 overflow-hidden lg:grid-cols-2"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                    >
                      {coaching?.summary && (
                        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4 lg:col-span-2">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Coach Summary</p>
                          <p className="text-base leading-relaxed text-[var(--foreground)]">{coaching.summary}</p>
                        </div>
                      )}

                      {coachingTopCues.length > 0 && (
                        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Top Cues</p>
                          <div className="space-y-2">
                            {coachingTopCues.map((cue, index) => (
                              <div key={`${log.id}-cue-${index}`} className="flex items-start gap-2 text-base leading-relaxed text-[var(--foreground)]">
                                <span className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-50)] text-xs font-extrabold text-[var(--primary-600)] dark:bg-[var(--primary-100)] dark:text-[var(--primary-700)]">
                                  {index + 1}
                                </span>
                                <span>{cue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {coachingObservations.length > 0 && (
                        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Rep Notes</p>
                          <div className="space-y-2">
                            {coachingObservations.map((observation, index) => (
                              <p key={`${log.id}-observation-${index}`} className="text-base leading-relaxed text-[var(--foreground)]">
                                {observation}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {topIssues.length > 0 && (
                        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4 lg:col-span-2">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Session Cues</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {topIssues.slice(0, 4).map((issue, index) => (
                              <p key={`${log.id}-issue-${index}`} className="rounded-[var(--radius-md)] bg-[var(--surface)] p-3 text-base leading-relaxed text-[var(--foreground)]">
                                {issue.message}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}

                      {!coaching && log.feedback_summary && (
                        <div className="rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4 lg:col-span-2">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Session Notes</p>
                          <p className="text-base leading-relaxed text-[var(--foreground)]">{log.feedback_summary}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </LoadReveal>
  );
}
