"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Eye, Edit3, Save, ChevronLeft, Plus, Trash2 } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import {
  FORM_PATTERNS,
  createEmptyOverrides,
  getFormPatternById,
  resolveExerciseFormRules,
  type FormPatternDefinition,
} from "@/lib/form-rules";
import type {
  ExerciseFormRules,
  FormRuleApplicability,
  FormRuleView,
} from "@/types";

interface Exercise {
  exercise_id: string;
  name: string;
  target_muscles: string[] | null;
  body_parts: string[] | null;
  form_rules: ExerciseFormRules | null;
}

function createDefaultRules(patternId = FORM_PATTERNS[0]?.id ?? "horizontal_push"): ExerciseFormRules {
  const pattern = getFormPatternById(patternId) ?? FORM_PATTERNS[0];
  return {
    patternId: pattern.id,
    applicability: pattern.applicability,
    view: pattern.view,
    confidence: 0.8,
    primaryMetric: pattern.primaryMetric,
    overrides: createEmptyOverrides(),
    review: {
      status: "needs_review",
      notes: "",
    },
  };
}

export default function AdminFormRulesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "realtime" | "post_set_only" | "not_applicable" | "needs_review">("all");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingRules, setEditingRules] = useState<ExerciseFormRules | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) {
        router.push("/login");
        return;
      }
      const session = await sessionRes.json();
      if (session.user?.role !== "admin") {
        router.push("/dashboard");
        return;
      }
      setIsAdmin(true);
    }
    checkAdmin();
  }, [router]);

  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exercises/list");
      if (res.ok) {
        const json = await res.json();
        setExercises(json.exercises);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchExercises();
  }, [isAdmin, fetchExercises]);

  const openView = (exercise: Exercise) => setViewingExercise(exercise);
  const closeView = () => setViewingExercise(null);

  const openEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setEditingRules(exercise.form_rules ? JSON.parse(JSON.stringify(exercise.form_rules)) : createDefaultRules());
    setError("");
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingExercise || !editingRules) return;
    setSaving(true);
    setError("");

    setExercises((prev) =>
      prev.map((exercise) =>
        exercise.exercise_id === editingExercise.exercise_id
          ? { ...exercise, form_rules: editingRules }
          : exercise,
      ),
    );
    setShowEditModal(false);

    try {
      const res = await fetch(`/api/admin/exercises/${editingExercise.exercise_id}/form-rules`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ form_rules: editingRules }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error || "Failed to save rules");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  const updateRuleThreshold = (index: number, field: "ruleId" | "min" | "max", value: string | number) => {
    if (!editingRules) return;
    const next = [...editingRules.overrides.ruleThresholds];
    const current = next[index] ?? { ruleId: "", min: undefined, max: undefined };
    next[index] = { ...current, [field]: value };
    setEditingRules({
      ...editingRules,
      overrides: { ...editingRules.overrides, ruleThresholds: next },
    });
  };

  const updateCueOverride = (index: number, field: "ruleId" | "cue", value: string) => {
    if (!editingRules) return;
    const next = [...editingRules.overrides.cueOverrides];
    const current = next[index] ?? { ruleId: "", cue: "" };
    next[index] = { ...current, [field]: value };
    setEditingRules({
      ...editingRules,
      overrides: { ...editingRules.overrides, cueOverrides: next },
    });
  };

  const removeRuleThreshold = (index: number) => {
    if (!editingRules) return;
    setEditingRules({
      ...editingRules,
      overrides: {
        ...editingRules.overrides,
        ruleThresholds: editingRules.overrides.ruleThresholds.filter((_, i) => i !== index),
      },
    });
  };

  const removeCueOverride = (index: number) => {
    if (!editingRules) return;
    setEditingRules({
      ...editingRules,
      overrides: {
        ...editingRules.overrides,
        cueOverrides: editingRules.overrides.cueOverrides.filter((_, i) => i !== index),
      },
    });
  };

  const filtered = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase())
      || (exercise.target_muscles ?? []).some((muscle) => muscle.toLowerCase().includes(search.toLowerCase()));

    const formRules = exercise.form_rules;
    let matchesFilter = true;
    if (filter === "realtime") matchesFilter = formRules?.applicability === "realtime";
    else if (filter === "post_set_only") matchesFilter = formRules?.applicability === "post_set_only";
    else if (filter === "not_applicable") matchesFilter = formRules?.applicability === "not_applicable";
    else if (filter === "needs_review") matchesFilter = !formRules || formRules.review.status === "needs_review";

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: exercises.length,
    realtime: exercises.filter((exercise) => exercise.form_rules?.applicability === "realtime").length,
    postSetOnly: exercises.filter((exercise) => exercise.form_rules?.applicability === "post_set_only").length,
    notApplicable: exercises.filter((exercise) => exercise.form_rules?.applicability === "not_applicable").length,
    needsReview: exercises.filter((exercise) => !exercise.form_rules || exercise.form_rules.review.status === "needs_review").length,
  };

  const editingPattern = useMemo<FormPatternDefinition | null>(
    () => (editingRules ? getFormPatternById(editingRules.patternId) : null),
    [editingRules],
  );

  if (!isAdmin || loading) {
    return (
      <div className="w-full">
        <Skeleton width={100} height={36} className="mb-4" />
        <Skeleton width={240} height={24} className="mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={64} className="rounded-lg" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={72} className="rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/exercises")}
          className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-overlay)] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Pattern Form Rules</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Review exercise pattern mapping and overrides</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="p-4 rounded-lg bg-[var(--surface-raised)]">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Realtime</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.realtime}</p>
        </div>
        <div className="p-4 rounded-lg bg-sky-500/10 border border-sky-500/20">
          <p className="text-xs text-sky-600 dark:text-sky-400 uppercase tracking-wider">Post Set</p>
          <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{stats.postSetOnly}</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">Not Applicable</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.notApplicable}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider">Needs Review</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.needsReview}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
          <input
            className="w-full pl-10 pr-4 py-2.5 rounded-[var(--radius)] bg-[var(--surface-raised)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]"
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "realtime", "post_set_only", "not_applicable", "needs_review"] as const).map((value) => (
            <button
              key={value}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                filter === value
                  ? "bg-[var(--primary-500)] text-white"
                  : "bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setFilter(value)}
            >
              {value === "all"
                ? "All"
                : value === "post_set_only"
                  ? "Post Set"
                  : value === "not_applicable"
                    ? "Not Applicable"
                    : value === "needs_review"
                      ? "Needs Review"
                      : "Realtime"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          No exercises match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exercise) => {
            const resolved = resolveExerciseFormRules(exercise.form_rules);
            return (
              <div
                key={exercise.exercise_id}
                className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--primary-500)]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--foreground)] truncate">{exercise.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {exercise.form_rules
                      ? `${resolved?.pattern.label ?? exercise.form_rules.patternId} • ${exercise.form_rules.applicability} • ${Math.round(exercise.form_rules.confidence * 100)}%`
                      : "No pattern mapping yet"}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    Review: {exercise.form_rules?.review.status ?? "missing"}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openView(exercise)}
                    className="w-8 h-8 rounded-lg hover:bg-[var(--surface-overlay)] flex items-center justify-center transition-colors"
                    title="View rules"
                  >
                    <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </button>
                  <button
                    onClick={() => openEdit(exercise)}
                    className="w-8 h-8 rounded-lg hover:bg-[var(--surface-overlay)] flex items-center justify-center transition-colors"
                    title="Edit rules"
                  >
                    <Edit3 className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewingExercise && (
        <ModalWrapper isOpen={!!viewingExercise} onClose={closeView} containerClassName="max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
          <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={closeView}>
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">{viewingExercise.name}</h2>
          {viewingExercise.form_rules ? (
            <>
              <p className="text-sm text-[var(--muted-foreground)] mb-4">
                Pattern: {getFormPatternById(viewingExercise.form_rules.patternId)?.label ?? viewingExercise.form_rules.patternId}
              </p>
              <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)] mb-4">
                <p className="font-semibold text-[var(--foreground)] mb-2">Exercise Mapping</p>
                <p className="text-sm text-[var(--muted-foreground)]">Applicability: {viewingExercise.form_rules.applicability}</p>
                <p className="text-sm text-[var(--muted-foreground)]">View: {viewingExercise.form_rules.view}</p>
                <p className="text-sm text-[var(--muted-foreground)]">Confidence: {Math.round(viewingExercise.form_rules.confidence * 100)}%</p>
                <p className="text-sm text-[var(--muted-foreground)]">Review: {viewingExercise.form_rules.review.status}</p>
                {viewingExercise.form_rules.review.notes && (
                  <p className="text-sm text-[var(--foreground)] mt-2">{viewingExercise.form_rules.review.notes}</p>
                )}
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)] mb-4">
                <p className="font-semibold text-[var(--foreground)] mb-3">Inherited Pattern Rules</p>
                {(getFormPatternById(viewingExercise.form_rules.patternId)?.rules ?? []).map((rule) => (
                  <div key={rule.id} className="mb-3 last:mb-0">
                    <p className="text-sm font-medium text-[var(--foreground)]">{rule.id}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      {rule.phase} • {rule.min}°-{rule.max}° • {rule.cue}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
                <p className="font-semibold text-[var(--foreground)] mb-3">Overrides</p>
                <pre className="text-xs whitespace-pre-wrap text-[var(--muted-foreground)]">
                  {JSON.stringify(viewingExercise.form_rules.overrides, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">No rules generated yet.</p>
          )}
        </ModalWrapper>
      )}

      <ModalWrapper isOpen={showEditModal} onClose={() => setShowEditModal(false)} containerClassName="max-w-3xl p-6 max-h-[85vh] overflow-y-auto">
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={() => setShowEditModal(false)}>
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">Edit Rules: {editingExercise?.name}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Assign a movement pattern and tune exercise overrides</p>

        {error && <div className="mb-4 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-sm)] text-sm font-medium">{error}</div>}

        {editingRules && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Pattern</label>
                <select
                  className="input text-sm"
                  value={editingRules.patternId}
                  onChange={(e) => {
                    const pattern = getFormPatternById(e.target.value);
                    if (!pattern) return;
                    setEditingRules({
                      ...editingRules,
                      patternId: pattern.id,
                      applicability: pattern.applicability,
                      view: pattern.view,
                      primaryMetric: pattern.primaryMetric,
                    });
                  }}
                >
                  {FORM_PATTERNS.map((pattern) => (
                    <option key={pattern.id} value={pattern.id}>{pattern.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Applicability</label>
                <select
                  className="input text-sm"
                  value={editingRules.applicability}
                  onChange={(e) => setEditingRules({ ...editingRules, applicability: e.target.value as FormRuleApplicability })}
                >
                  <option value="realtime">Realtime</option>
                  <option value="post_set_only">Post Set Only</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">View</label>
                <select
                  className="input text-sm"
                  value={editingRules.view}
                  onChange={(e) => setEditingRules({ ...editingRules, view: e.target.value as FormRuleView })}
                >
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="three_quarter">Three Quarter</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Confidence</label>
                <input
                  className="input text-sm"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={editingRules.confidence}
                  onChange={(e) => setEditingRules({ ...editingRules, confidence: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Review Status</label>
                <select
                  className="input text-sm"
                  value={editingRules.review.status}
                  onChange={(e) => setEditingRules({ ...editingRules, review: { ...editingRules.review, status: e.target.value as ExerciseFormRules["review"]["status"] } })}
                >
                  <option value="ai_generated">AI Generated</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="needs_review">Needs Review</option>
                </select>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
              <p className="font-semibold text-[var(--foreground)] mb-2">Primary Metric</p>
              <p className="text-sm text-[var(--muted-foreground)]">
                {editingRules.primaryMetric.kind} • [{editingRules.primaryMetric.landmarks.join(", ")}]
              </p>
            </div>

            {editingPattern && (
              <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
                <p className="font-semibold text-[var(--foreground)] mb-3">Inherited Pattern Rules</p>
                {editingPattern.rules.map((rule) => {
                  const disabled = editingRules.overrides.disabledRuleIds.includes(rule.id);
                  return (
                    <div key={rule.id} className="flex items-start justify-between gap-3 py-2 border-b border-[var(--border)] last:border-b-0">
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">{rule.id}</p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          {rule.phase} • {rule.min}°-{rule.max}° • {rule.cue}
                        </p>
                      </div>
                      <label className="text-xs text-[var(--muted-foreground)] flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!disabled}
                          onChange={(e) => {
                            const next = new Set(editingRules.overrides.disabledRuleIds);
                            if (!e.target.checked) next.add(rule.id);
                            else next.delete(rule.id);
                            setEditingRules({
                              ...editingRules,
                              overrides: {
                                ...editingRules.overrides,
                                disabledRuleIds: Array.from(next),
                              },
                            });
                          }}
                        />
                        Enabled
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[var(--foreground)]">Threshold Overrides</p>
                <Button
                  variant="secondary"
                  onClick={() => setEditingRules({
                    ...editingRules,
                    overrides: {
                      ...editingRules.overrides,
                      ruleThresholds: [...editingRules.overrides.ruleThresholds, { ruleId: "", min: undefined, max: undefined }],
                    },
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {editingRules.overrides.ruleThresholds.map((override, index) => (
                  <div key={`${override.ruleId}-${index}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
                    <select className="input text-sm" value={override.ruleId} onChange={(e) => updateRuleThreshold(index, "ruleId", e.target.value)}>
                      <option value="">Select rule</option>
                      {(editingPattern?.rules ?? []).map((rule) => (
                        <option key={rule.id} value={rule.id}>{rule.id}</option>
                      ))}
                    </select>
                    <input className="input text-sm" type="number" placeholder="Min" value={override.min ?? ""} onChange={(e) => updateRuleThreshold(index, "min", parseFloat(e.target.value))} />
                    <input className="input text-sm" type="number" placeholder="Max" value={override.max ?? ""} onChange={(e) => updateRuleThreshold(index, "max", parseFloat(e.target.value))} />
                    <button className="w-10 h-10 rounded-lg hover:bg-red-500/10 flex items-center justify-center" onClick={() => removeRuleThreshold(index)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-[var(--foreground)]">Cue Overrides</p>
                <Button
                  variant="secondary"
                  onClick={() => setEditingRules({
                    ...editingRules,
                    overrides: {
                      ...editingRules.overrides,
                      cueOverrides: [...editingRules.overrides.cueOverrides, { ruleId: "", cue: "" }],
                    },
                  })}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add
                </Button>
              </div>
              <div className="space-y-3">
                {editingRules.overrides.cueOverrides.map((override, index) => (
                  <div key={`${override.ruleId}-${index}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <select className="input text-sm" value={override.ruleId} onChange={(e) => updateCueOverride(index, "ruleId", e.target.value)}>
                      <option value="">Select rule</option>
                      {(editingPattern?.rules ?? []).map((rule) => (
                        <option key={rule.id} value={rule.id}>{rule.id}</option>
                      ))}
                    </select>
                    <input className="input text-sm md:col-span-1" value={override.cue} onChange={(e) => updateCueOverride(index, "cue", e.target.value)} placeholder="Custom cue" />
                    <button className="w-10 h-10 rounded-lg hover:bg-red-500/10 flex items-center justify-center" onClick={() => removeCueOverride(index)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Review Notes</label>
              <textarea
                className="input text-sm min-h-24"
                value={editingRules.review.notes ?? ""}
                onChange={(e) => setEditingRules({ ...editingRules, review: { ...editingRules.review, notes: e.target.value } })}
                placeholder="Optional notes about the AI-generated mapping"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)} block>Cancel</Button>
              <Button onClick={handleSave} disabled={saving} block>
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </ModalWrapper>
    </div>
  );
}
