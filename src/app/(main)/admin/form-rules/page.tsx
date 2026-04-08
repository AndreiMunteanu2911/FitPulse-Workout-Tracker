'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, CheckCircle, AlertCircle, Eye, Edit3, Save, ChevronLeft, Plus } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";

interface FormRule {
  name: string;
  landmarks: number[];
  description: string;
  phase: "eccentric" | "concentric" | "both";
  min: number;
  max: number;
  cue: string;
}

interface TempoRule {
  eccentricSeconds: number;
  pauseSeconds: number;
  concentricSeconds: number;
}

interface FormRules {
  rules: FormRule[];
  tempo?: TempoRule;
  applicable?: boolean;
}

interface Exercise {
  exercise_id: string;
  name: string;
  target_muscles: string[] | null;
  body_parts: string[] | null;
  form_rules: FormRules | null;
}

// MediaPipe landmark name lookup (Pose 33)
const LANDMARK_NAMES: Record<number, string> = {
  0: "Nose", 1: "L Eye In", 2: "L Eye", 3: "L Eye Out", 4: "R Eye In",
  5: "R Eye", 6: "R Eye Out", 7: "L Ear", 8: "R Ear", 9: "L Mouth", 10: "R Mouth",
  11: "L Shoulder", 12: "R Shoulder",
  13: "L Elbow", 14: "R Elbow",
  15: "L Wrist", 16: "R Wrist",
  17: "L Pinky", 18: "R Pinky",
  19: "L Index", 20: "R Index",
  21: "L Thumb", 22: "R Thumb",
  23: "L Hip", 24: "R Hip",
  25: "L Knee", 26: "R Knee",
  27: "L Ankle", 28: "R Ankle",
  29: "L Heel", 30: "R Heel",
  31: "L Foot", 32: "R Foot",
};

function landmarkLabel(indices: number[]): string {
  return indices.map((i) => `${i}:${LANDMARK_NAMES[i] ?? "?"}`).join(" → ");
}

export default function AdminFormRulesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "has-rules" | "no-rules" | "not-applicable">("all");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [editingRules, setEditingRules] = useState<FormRules | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // View modal
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const sessionRes = await fetch("/api/auth/session");
      if (!sessionRes.ok) { router.push("/login"); return; }
      const session = await sessionRes.json();
      if (session.user?.role !== "admin") { router.push("/dashboard"); return; }
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

  const openView = (ex: Exercise) => setViewingExercise(ex);
  const closeView = () => setViewingExercise(null);

  const openEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setEditingRules(ex.form_rules ? JSON.parse(JSON.stringify(ex.form_rules)) : { rules: [] });
    setError("");
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!editingExercise || !editingRules) return;
    setSaving(true);
    setError("");

    // Optimistic update
    setExercises((prev) => prev.map((ex) => ex.exercise_id === editingExercise.exercise_id ? { ...ex, form_rules: editingRules } : ex));
    setShowEditModal(false);
    setSaving(false);

    // Persist
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
    }
  };

  const addRule = () => {
    if (!editingRules) return;
    const newRule: FormRule = {
      name: "New Rule",
      landmarks: [0, 0, 0],
      description: "",
      phase: "both",
      min: 0,
      max: 180,
      cue: "Adjust your form",
    };
    setEditingRules({ ...editingRules, rules: [...editingRules.rules, newRule] });
  };

  const updateRule = (index: number, field: keyof FormRule, value: any) => {
    if (!editingRules) return;
    const updated = [...editingRules.rules];
    updated[index] = { ...updated[index], [field]: value };
    setEditingRules({ ...editingRules, rules: updated });
  };

  const updateLandmark = (ruleIndex: number, landmarkIndex: number, value: number) => {
    if (!editingRules) return;
    const updated = [...editingRules.rules];
    const landmarks = [...updated[ruleIndex].landmarks];
    landmarks[landmarkIndex] = value;
    updated[ruleIndex] = { ...updated[ruleIndex], landmarks };
    setEditingRules({ ...editingRules, rules: updated });
  };

  const removeRule = (index: number) => {
    if (!editingRules) return;
    const updated = editingRules.rules.filter((_, i) => i !== index);
    setEditingRules({ ...editingRules, rules: updated });
  };

  // Filtering
  const filtered = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase()) ||
      (ex.target_muscles ?? []).some((m) => m.toLowerCase().includes(search.toLowerCase()));

    let matchesFilter = true;
    if (filter === "has-rules") matchesFilter = !!(ex.form_rules && ex.form_rules.applicable !== false && (ex.form_rules.rules?.length ?? 0) > 0);
    else if (filter === "no-rules") matchesFilter = !ex.form_rules || (ex.form_rules.rules?.length ?? 0) === 0;
    else if (filter === "not-applicable") matchesFilter = ex.form_rules?.applicable === false;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: exercises.length,
    withRules: exercises.filter((e) => e.form_rules && e.form_rules.applicable !== false && (e.form_rules.rules?.length ?? 0) > 0).length,
    notApplicable: exercises.filter((e) => e.form_rules?.applicable === false).length,
    noRules: exercises.filter((e) => !e.form_rules || (e.form_rules.rules?.length ?? 0) === 0).length,
  };

  if (!isAdmin || loading) {
    return (
      <div className="w-full">
        <Skeleton width={100} height={36} className="mb-4" />
        <Skeleton width={240} height={24} className="mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={64} className="rounded-lg" />)}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} height={72} className="rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Back button + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin/exercises")}
          className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--surface-overlay)] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-[var(--muted-foreground)]" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[var(--foreground)]">Form Rules Review</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Review and edit AI-generated form checking rules</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-4 rounded-lg bg-[var(--surface-raised)]">
          <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-[var(--foreground)]">{stats.total}</p>
        </div>
        <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Has Rules</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.withRules}</p>
        </div>
        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 uppercase tracking-wider">N/A</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.notApplicable}</p>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-xs text-red-600 dark:text-red-400 uppercase tracking-wider">No Rules</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.noRules}</p>
        </div>
      </div>

      {/* Search + Filter */}
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
        <div className="flex gap-2">
          {(["all", "has-rules", "no-rules", "not-applicable"] as const).map((f) => (
            <button
              key={f}
              className={`px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-[var(--primary-500)] text-white"
                  : "bg-[var(--surface-raised)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All" : f === "has-rules" ? "Has Rules" : f === "no-rules" ? "No Rules" : "N/A"}
            </button>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)]">
          No exercises match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ex) => {
            const ruleCount = ex.form_rules?.applicable === false ? 0 : (ex.form_rules?.rules?.length ?? 0);
            const isNA = ex.form_rules?.applicable === false;
            return (
              <div
                key={ex.exercise_id}
                className="flex items-center justify-between p-4 rounded-lg bg-[var(--surface-raised)] border border-[var(--border)] hover:border-[var(--primary-500)]/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--foreground)] truncate">{ex.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {isNA ? (
                      <span className="text-amber-500">Not applicable (cardio/stretch)</span>
                    ) : ruleCount > 0 ? (
                      <span className="text-emerald-500">{ruleCount} rules</span>
                    ) : (
                      <span className="text-red-400">No rules generated</span>
                    )}
                    {ex.form_rules?.tempo && ` · Tempo: ${ex.form_rules.tempo.eccentricSeconds}-${ex.form_rules.tempo.pauseSeconds}-${ex.form_rules.tempo.concentricSeconds}`}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => openView(ex)}
                    className="w-8 h-8 rounded-lg hover:bg-[var(--surface-overlay)] flex items-center justify-center transition-colors"
                    title="View rules"
                  >
                    <Eye className="w-4 h-4 text-[var(--muted-foreground)]" />
                  </button>
                  <button
                    onClick={() => openEdit(ex)}
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

      {/* View Modal */}
      {viewingExercise && (
        <ModalWrapper isOpen={!!viewingExercise} onClose={closeView} containerClassName="max-w-lg p-6 max-h-[80vh] overflow-y-auto">
          <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={closeView}>
            <X className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">{viewingExercise.name}</h2>
          <p className="text-sm text-[var(--muted-foreground)] mb-4">
            {viewingExercise.form_rules?.applicable === false
              ? "Form rules not applicable — exercise type doesn't support angle-based checking"
              : viewingExercise.form_rules?.rules?.length
                ? `${viewingExercise.form_rules.rules.length} form rules defined`
                : "No rules generated"}
          </p>

          {viewingExercise.form_rules?.applicable !== false && viewingExercise.form_rules?.rules?.map((rule, i) => (
            <div key={i} className="mb-4 p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-[var(--foreground)]">{rule.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  rule.phase === "eccentric" ? "bg-blue-500/10 text-blue-400" :
                  rule.phase === "concentric" ? "bg-green-500/10 text-green-400" :
                  "bg-[var(--muted-foreground)]/10 text-[var(--muted-foreground)]"
                }`}>{rule.phase}</span>
              </div>
              <p className="text-xs text-[var(--muted-foreground)] mb-2">{rule.description}</p>
              <p className="text-xs font-mono bg-[var(--surface-raised)] px-2 py-1 rounded mb-2">
                {landmarkLabel(rule.landmarks)}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-[var(--muted-foreground)]">Range: <span className="text-[var(--foreground)] font-medium">{rule.min}°–{rule.max}°</span></span>
              </div>
              <p className="text-sm text-[var(--primary-500)] mt-2">💬 "{rule.cue}"</p>
            </div>
          ))}

          {viewingExercise.form_rules?.tempo && (
            <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
              <p className="font-semibold text-[var(--foreground)] mb-2">Suggested Tempo</p>
              <div className="flex gap-4 text-sm">
                <span>Eccentric: <strong>{viewingExercise.form_rules.tempo.eccentricSeconds}s</strong></span>
                <span>Pause: <strong>{viewingExercise.form_rules.tempo.pauseSeconds}s</strong></span>
                <span>Concentric: <strong>{viewingExercise.form_rules.tempo.concentricSeconds}s</strong></span>
              </div>
            </div>
          )}
        </ModalWrapper>
      )}

      {/* Edit Modal */}
      <ModalWrapper isOpen={showEditModal} onClose={() => setShowEditModal(false)} containerClassName="max-w-2xl p-6 max-h-[85vh] overflow-y-auto">
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={() => setShowEditModal(false)}>
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">Edit Rules: {editingExercise?.name}</h2>
        <p className="text-sm text-[var(--muted-foreground)] mb-4">Adjust AI-generated rules or add new ones</p>

        {error && <div className="mb-4 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-sm)] text-sm font-medium">{error}</div>}

        {editingRules && (
          <div className="space-y-4">
            {/* Applicable toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
              <div>
                <p className="font-medium text-[var(--foreground)]">Applicable</p>
                <p className="text-xs text-[var(--muted-foreground)]">Toggle if this exercise supports angle-based form checking</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingRules.applicable !== false}
                  onChange={(e) => setEditingRules({ ...editingRules, applicable: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[var(--muted-foreground)]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)]"></div>
              </label>
            </div>

            {editingRules.applicable !== false && (
              <>
                {/* Rules */}
                {editingRules.rules.map((rule, i) => (
                  <div key={i} className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        className="input font-semibold text-sm flex-1 mr-3"
                        value={rule.name}
                        onChange={(e) => updateRule(i, "name", e.target.value)}
                        placeholder="Rule name"
                      />
                      <button
                        onClick={() => removeRule(i)}
                        className="w-8 h-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors flex-shrink-0"
                        title="Remove rule"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>

                    {/* Landmarks */}
                    <div className="mb-3">
                      <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Landmarks (vertex is 2nd)</label>
                      <div className="flex gap-2">
                        {rule.landmarks.map((lm, li) => (
                          <select
                            key={li}
                            className="input text-xs flex-1"
                            value={lm}
                            onChange={(e) => updateLandmark(i, li, parseInt(e.target.value))}
                          >
                            {Array.from({ length: 33 }, (_, idx) => (
                              <option key={idx} value={idx}>{idx}: {LANDMARK_NAMES[idx] ?? idx}</option>
                            ))}
                          </select>
                        ))}
                      </div>
                      <p className="text-xs font-mono text-[var(--muted-foreground)] mt-1">{landmarkLabel(rule.landmarks)}</p>
                    </div>

                    <div className="mb-3">
                      <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Description</label>
                      <input
                        className="input text-sm"
                        value={rule.description}
                        onChange={(e) => updateRule(i, "description", e.target.value)}
                        placeholder="What this checks"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Phase</label>
                        <select
                          className="input text-sm"
                          value={rule.phase}
                          onChange={(e) => updateRule(i, "phase", e.target.value)}
                        >
                          <option value="both">Both</option>
                          <option value="eccentric">Eccentric</option>
                          <option value="concentric">Concentric</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Min (°)</label>
                        <input
                          className="input text-sm"
                          type="number"
                          min={0}
                          max={180}
                          value={rule.min}
                          onChange={(e) => updateRule(i, "min", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Max (°)</label>
                        <input
                          className="input text-sm"
                          type="number"
                          min={0}
                          max={180}
                          value={rule.max}
                          onChange={(e) => updateRule(i, "max", parseInt(e.target.value) || 180)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Cue (shown to user)</label>
                      <input
                        className="input text-sm"
                        value={rule.cue}
                        onChange={(e) => updateRule(i, "cue", e.target.value)}
                        placeholder="Short instruction when out of range"
                        maxLength={60}
                      />
                    </div>
                  </div>
                ))}

                {/* Tempo */}
                {editingRules.tempo && (
                  <div className="p-4 rounded-lg bg-[var(--surface-base)] border border-[var(--border)]">
                    <p className="font-semibold text-[var(--foreground)] mb-3">Suggested Tempo</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Eccentric (s)</label>
                        <input
                          className="input text-sm"
                          type="number"
                          min={0}
                          step={0.5}
                          value={editingRules.tempo.eccentricSeconds}
                          onChange={(e) => setEditingRules({ ...editingRules, tempo: { ...editingRules.tempo!, eccentricSeconds: parseFloat(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Pause (s)</label>
                        <input
                          className="input text-sm"
                          type="number"
                          min={0}
                          step={0.5}
                          value={editingRules.tempo.pauseSeconds}
                          onChange={(e) => setEditingRules({ ...editingRules, tempo: { ...editingRules.tempo!, pauseSeconds: parseFloat(e.target.value) || 0 } })}
                        />
                      </div>
                      <div>
                        <label className="block mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Concentric (s)</label>
                        <input
                          className="input text-sm"
                          type="number"
                          min={0}
                          step={0.5}
                          value={editingRules.tempo.concentricSeconds}
                          onChange={(e) => setEditingRules({ ...editingRules, tempo: { ...editingRules.tempo!, concentricSeconds: parseFloat(e.target.value) || 0 } })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <Button variant="secondary" onClick={addRule} block>
                  <Plus className="w-4 h-4 mr-2" /> Add Rule
                </Button>
              </>
            )}

            {/* Save */}
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
