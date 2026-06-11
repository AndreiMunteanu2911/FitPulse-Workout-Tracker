'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, LayoutTemplate } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import EmptyState from "@/components/admin/EmptyState";
import TemplateCard from "@/components/admin/TemplateCard";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import { useAuthSession } from "@/components/AuthSessionProvider";

interface Template {
  id: string;
  name: string;
  description: string | null;
  is_official: boolean;
  created_at: string;
  template_exercises: { exercise_id: string; order_index: number }[];
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin, isAuthenticated } = useAuthSession();

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formExerciseIds, setFormExerciseIds] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState<Template | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/templates");
      if (res.ok) {
        const json = await res.json();
        setTemplates((json.templates ?? []).filter((t: Template) => t.is_official));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchTemplates();
  }, [isAdmin, fetchTemplates]);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isAdmin, router]);

  const addExerciseField = () => setFormExerciseIds([...formExerciseIds, ""]);
  const removeExerciseField = (idx: number) => setFormExerciseIds(formExerciseIds.filter((_, i) => i !== idx));
  const updateExerciseField = (idx: number, val: string) => {
    const updated = [...formExerciseIds];
    updated[idx] = val;
    setFormExerciseIds(updated);
  };

  const openCreate = () => {
    setFormName("");
    setFormDescription("");
    setFormExerciseIds([""]);
    setError("");
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const exercises = formExerciseIds
      .filter((id) => id.trim() !== "")
      .map((exercise_id) => ({ exercise_id: exercise_id.trim() }));

    const tempId = crypto.randomUUID();
    const newTemplate: Template = { id: tempId, name: formName.trim(), description: formDescription.trim() || null, is_official: true, created_at: new Date().toISOString(), template_exercises: exercises.map((ex, i) => ({ exercise_id: ex.exercise_id, order_index: i })) };

    // Optimistic: add to list immediately
    setTemplates((prev) => [newTemplate, ...prev]);
    setShowCreateModal(false);
    setSaving(false);

    // Persist in background
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName.trim(), description: formDescription.trim() || null, exercises }),
      });
      if (!res.ok) {
        const json = await res.json();
        setTemplates((prev) => prev.filter((t) => t.id !== tempId));
        setError(json.error || "Failed to create template");
      }
    } catch {
      setTemplates((prev) => prev.filter((t) => t.id !== tempId));
      setError("Network error");
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    const targetId = deletingTemplate?.id;

    // Optimistic: remove from list immediately
    setTemplates((prev) => prev.filter((t) => t.id !== targetId));
    setShowDeleteModal(false);
    setSaving(false);

    // Persist in background
    try {
      const res = await fetch(`/api/admin/templates/${targetId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setTemplates((prev) => prev.includes(deletingTemplate!) ? [deletingTemplate!, ...prev.filter((t) => t.id !== targetId)] : prev);
        setError(json.error || "Failed to delete template");
      }
    } catch {
      setTemplates((prev) => prev.includes(deletingTemplate!) ? [deletingTemplate!, ...prev.filter((t) => t.id !== targetId)] : prev);
      setError("Network error");
    }
  };

  if (isAuthenticated && !isAdmin) return null;

  if (!isAdmin || loading) {
    return (
      <div className="flex min-h-[18rem] w-full items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <LoadReveal className="page-stack">
      <AdminPageHeader
        title="Admin — Templates"
        subtitle="Manage official workout templates"
        backHref="/admin"
        action={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" /> Create Template
          </Button>
        }
      />

      {/* Template List */}
      {templates.length === 0 ? (
        <EmptyState
          icon={<LayoutTemplate className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />}
          title="No official templates yet"
          description="Create an official template that all users can access."
        />
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              name={t.name}
              description={t.description}
              exerciseCount={t.template_exercises.length}
              isOfficial={t.is_official}
              onDelete={() => { setDeletingTemplate(t); setShowDeleteModal(true); }}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <ModalWrapper isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} containerClassName="max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={() => setShowCreateModal(false)}>
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Create Official Template</h2>
        {error && <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-sm)] text-sm font-medium">{error}</div>}
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Name</label>
            <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g. Starting Strength 5x5" />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Description</label>
            <textarea className="input" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description" rows={2} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Exercises (exercise IDs)</label>
            {formExerciseIds.map((id, idx) => (
              <div key={idx} className="flex items-center gap-2 mb-2">
                <input
                  className="input flex-1"
                  value={id}
                  onChange={(e) => updateExerciseField(idx, e.target.value)}
                  placeholder="e.g. bench-press"
                />
                {formExerciseIds.length > 1 && (
                  <button type="button" onClick={() => removeExerciseField(idx)} className="w-8 h-8 rounded-lg hover:bg-[var(--color-destructive-bg)] flex items-center justify-center flex-shrink-0">
                    <X className="w-4 h-4 text-[var(--color-destructive)]" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addExerciseField} className="text-sm text-[var(--primary-600)] dark:text-[var(--primary-500)] font-semibold hover:underline">
              + Add Exercise
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)} block>Cancel</Button>
            <Button type="submit" disabled={saving} block>{saving ? "Creating..." : "Create"}</Button>
          </div>
        </form>
      </ModalWrapper>

      {/* Delete Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Template"
        itemName={deletingTemplate?.name ?? ""}
        onConfirm={handleDelete}
        error={error}
        loading={saving}
      />
    </LoadReveal>
  );
}
