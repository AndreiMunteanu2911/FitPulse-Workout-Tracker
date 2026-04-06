'use client';

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, X, RefreshCw } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import SearchInput from "@/components/admin/SearchInput";
import EmptyState from "@/components/admin/EmptyState";
import ExerciseListCard from "@/components/admin/ExerciseListCard";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";
import { Dumbbell } from "lucide-react";

/**
 * Generate a 7-character alphanumeric ID matching the existing exercise ID format.
 * Uses crypto.getRandomValues for cryptographically secure randomness.
 */
function generateExerciseId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

interface Exercise {
  exercise_id: string;
  name: string;
  gif_url: string | null;
  target_muscles: string | null;
  body_parts: string | null;
  equipments: string | null;
  is_custom?: boolean;
}

export default function AdminExercisesPage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deletingExercise, setDeletingExercise] = useState<Exercise | null>(null);

  // Form state
  const [formExerciseId, setFormExerciseId] = useState("");
  const [formName, setFormName] = useState("");
  const [formGifUrl, setFormGifUrl] = useState("");
  const [formTargetMuscles, setFormTargetMuscles] = useState("");
  const [formBodyParts, setFormBodyParts] = useState("");
  const [formEquipments, setFormEquipments] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    try {
      const res = await fetch("/api/exercises");
      if (res.ok) {
        const json = await res.json();
        setExercises(json.exercises.filter((e: Exercise) => !e.is_custom));
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdmin) fetchExercises();
  }, [isAdmin, fetchExercises]);

  const openAdd = () => {
    setFormExerciseId(generateExerciseId());
    setFormName("");
    setFormGifUrl("");
    setFormTargetMuscles("");
    setFormBodyParts("");
    setFormEquipments("");
    setError("");
    setShowAddModal(true);
  };

  const regenerateId = () => {
    setFormExerciseId(generateExerciseId());
  };

  const openEdit = (ex: Exercise) => {
    setEditingExercise(ex);
    setFormExerciseId(ex.exercise_id);
    setFormName(ex.name);
    setFormGifUrl(ex.gif_url ?? "");
    setFormTargetMuscles(ex.target_muscles ?? "");
    setFormBodyParts(ex.body_parts ?? "");
    setFormEquipments(ex.equipments ?? "");
    setError("");
    setShowEditModal(true);
  };

  const openDelete = (ex: Exercise) => {
    setDeletingExercise(ex);
    setError("");
    setShowDeleteModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const newExercise: Exercise = {
      exercise_id: formExerciseId.trim(),
      name: formName.trim(),
      gif_url: formGifUrl.trim() || null,
      target_muscles: formTargetMuscles.trim() || null,
      body_parts: formBodyParts.trim() || null,
      equipments: formEquipments.trim() || null,
    };

    // Optimistic: add to list immediately
    setExercises((prev) => [newExercise, ...prev]);
    setShowAddModal(false);
    setSaving(false);

    // Persist in background
    try {
      const res = await fetch("/api/admin/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newExercise),
      });
      if (!res.ok) {
        const json = await res.json();
        setExercises((prev) => prev.filter((ex) => ex.exercise_id !== newExercise.exercise_id));
        setError(json.error || "Failed to add exercise");
      }
    } catch {
      setExercises((prev) => prev.filter((ex) => ex.exercise_id !== newExercise.exercise_id));
      setError("Network error");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const updatedExercise: Exercise = {
      exercise_id: editingExercise!.exercise_id,
      name: formName.trim(),
      gif_url: formGifUrl.trim() || null,
      target_muscles: formTargetMuscles.trim() || null,
      body_parts: formBodyParts.trim() || null,
      equipments: formEquipments.trim() || null,
    };

    // Optimistic: update in list immediately
    setExercises((prev) => prev.map((ex) => ex.exercise_id === updatedExercise.exercise_id ? updatedExercise : ex));
    setShowEditModal(false);
    setSaving(false);

    // Persist in background
    try {
      const res = await fetch(`/api/admin/exercises/${editingExercise?.exercise_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedExercise),
      });
      if (!res.ok) {
        const json = await res.json();
        setExercises((prev) => prev.map((ex) => ex.exercise_id === updatedExercise.exercise_id ? editingExercise! : ex));
        setError(json.error || "Failed to update exercise");
      }
    } catch {
      setExercises((prev) => prev.map((ex) => ex.exercise_id === updatedExercise.exercise_id ? editingExercise! : ex));
      setError("Network error");
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError("");
    const targetId = deletingExercise?.exercise_id;

    // Optimistic: remove from list immediately
    setExercises((prev) => prev.filter((ex) => ex.exercise_id !== targetId));
    setShowDeleteModal(false);
    setSaving(false);

    // Persist in background
    try {
      const res = await fetch(`/api/admin/exercises/${targetId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setExercises((prev) => prev.includes(deletingExercise!) ? [deletingExercise!, ...prev.filter((ex) => ex.exercise_id !== targetId)] : prev);
        setError(json.error || "Failed to delete exercise");
      }
    } catch {
      setExercises((prev) => prev.includes(deletingExercise!) ? [deletingExercise!, ...prev.filter((ex) => ex.exercise_id !== targetId)] : prev);
      setError("Network error");
    }
  };

  if (!isAdmin || loading) {
    return (
      <div className="w-full">
        <div className="page-header mb-6">
          <Skeleton width={160} height={28} className="mb-2" />
          <Skeleton width={220} />
        </div>
        <div className="flex gap-3 mb-6">
          <Skeleton height={40} className="flex-1 rounded-xl" />
          <Skeleton width={120} height={40} />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} height={60} className="rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = search.trim()
    ? exercises.filter((ex) => ex.name.toLowerCase().includes(search.toLowerCase()))
    : exercises;

  return (
    <div className="w-full">
      <AdminPageHeader
        title="Admin — Exercises"
        subtitle="Manage the standard exercise catalogue"
        backHref="/admin"
        action={
          <Button onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Exercise
          </Button>
        }
      />

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <SearchInput value={search} onChange={setSearch} placeholder="Search exercises..." />
      </div>

      {/* Exercise List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Dumbbell className="w-8 h-8 text-[var(--primary-600)] dark:text-[var(--primary-700)]" />}
          title="No exercises found"
          description={search ? "Try a different search term." : "Add your first exercise to get started."}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ex) => (
            <ExerciseListCard
              key={ex.exercise_id}
              exercise={ex}
              onEdit={(e) => openEdit(exercises.find((x) => x.exercise_id === e.exercise_id)!)}
              onDelete={(e) => openDelete(exercises.find((x) => x.exercise_id === e.exercise_id)!)}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      <ModalWrapper isOpen={showAddModal} onClose={() => setShowAddModal(false)} containerClassName="max-w-md p-6">
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={() => setShowAddModal(false)}>
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Add Exercise</h2>
        {error && <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-md)] text-sm font-medium">{error}</div>}
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Exercise ID</label>
            <div className="flex items-center gap-2">
              <input className="input flex-1" value={formExerciseId} onChange={(e) => setFormExerciseId(e.target.value)} placeholder="Auto-generated" />
              <button type="button" onClick={regenerateId} className="w-9 h-9 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-100)] flex items-center justify-center transition-colors flex-shrink-0" title="Regenerate ID">
                <RefreshCw className="w-4 h-4 text-[var(--muted-foreground)]" />
              </button>
            </div>
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Name</label>
            <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="e.g. Bench Press" />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">GIF URL</label>
            <input className="input" value={formGifUrl} onChange={(e) => setFormGifUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Target Muscles</label>
            <input className="input" value={formTargetMuscles} onChange={(e) => setFormTargetMuscles(e.target.value)} placeholder="chest, triceps" />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Body Parts</label>
            <input className="input" value={formBodyParts} onChange={(e) => setFormBodyParts(e.target.value)} placeholder="upper body" />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Equipment</label>
            <input className="input" value={formEquipments} onChange={(e) => setFormEquipments(e.target.value)} placeholder="barbell, bench" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)} block>Cancel</Button>
            <Button type="submit" disabled={saving} block>{saving ? "Adding..." : "Add"}</Button>
          </div>
        </form>
      </ModalWrapper>

      {/* Edit Modal */}
      <ModalWrapper isOpen={showEditModal} onClose={() => setShowEditModal(false)} containerClassName="max-w-md p-6">
        <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={() => setShowEditModal(false)}>
          <X className="w-4 h-4" />
        </button>
        <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Edit Exercise</h2>
        {error && <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-md)] text-sm font-medium">{error}</div>}
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Exercise ID</label>
            <input className="input" value={formExerciseId} disabled />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Name</label>
            <input className="input" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">GIF URL</label>
            <input className="input" value={formGifUrl} onChange={(e) => setFormGifUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Target Muscles</label>
            <input className="input" value={formTargetMuscles} onChange={(e) => setFormTargetMuscles(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Body Parts</label>
            <input className="input" value={formBodyParts} onChange={(e) => setFormBodyParts(e.target.value)} />
          </div>
          <div>
            <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Equipment</label>
            <input className="input" value={formEquipments} onChange={(e) => setFormEquipments(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)} block>Cancel</Button>
            <Button type="submit" disabled={saving} block>{saving ? "Saving..." : "Save"}</Button>
          </div>
        </form>
      </ModalWrapper>

      {/* Delete Confirm Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Exercise"
        itemName={deletingExercise?.name ?? ""}
        onConfirm={handleDelete}
        error={error}
        loading={saving}
      />
    </div>
  );
}
