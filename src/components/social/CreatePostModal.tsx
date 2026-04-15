"use client";

import { useState, useRef } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import type { Workout } from "@/types";
import { ImagePlus, X, Dumbbell } from "lucide-react";

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { content?: string; image?: File; workout_id?: string }) => Promise<void>;
  recentWorkouts?: Workout[];
}

export default function CreatePostModal({ isOpen, onClose, onSubmit, recentWorkouts = [] }: CreatePostModalProps) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showWorkoutPicker, setShowWorkoutPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedWorkout = recentWorkouts.find((w) => w.id === selectedWorkoutId) ?? null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    setContent("");
    setImage(null);
    setImagePreview(null);
    setSelectedWorkoutId(null);
    setShowWorkoutPicker(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!content.trim() && !image && !selectedWorkoutId) {
      setError("Add some text, an image, or a workout.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        content: content.trim() || undefined,
        image: image ?? undefined,
        workout_id: selectedWorkoutId ?? undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} containerClassName="max-w-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-[var(--foreground)]">New Post</h3>
        <button onClick={handleClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your progress, thoughts, or achievements..."
        rows={4}
        className="w-full px-4 py-3 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] text-[var(--foreground)] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] mb-3"
      />

      {imagePreview && (
        <div className="relative mb-3 rounded-[var(--radius-md)] overflow-hidden">
          <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover" />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {selectedWorkout && (
        <div className="mb-3 p-3 rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Dumbbell className="w-4 h-4 text-[var(--primary-600)] flex-shrink-0" />
            <span className="text-sm font-medium text-[var(--foreground)] truncate">{selectedWorkout.name}</span>
          </div>
          <button
            onClick={() => setSelectedWorkoutId(null)}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showWorkoutPicker && !selectedWorkout && (
        <div className="mb-3 bg-[var(--surface-raised)] rounded-[var(--radius-md)] overflow-hidden border border-[var(--border)]">
          {recentWorkouts.length === 0 ? (
            <p className="text-sm text-[var(--muted-foreground)] p-3">No completed workouts found.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto divide-y divide-[var(--border)]">
              {recentWorkouts.slice(0, 10).map((w) => (
                <button
                  key={w.id}
                  onClick={() => { setSelectedWorkoutId(w.id); setShowWorkoutPicker(false); }}
                  className="w-full text-left px-3 py-2.5 hover:bg-[var(--surface)] transition-colors"
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">{w.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {new Date(w.workout_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-[var(--color-destructive)] mb-3">{error}</p>
      )}

      <div className="flex items-center gap-2 mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          Photo
        </button>
        <button
          type="button"
          onClick={() => setShowWorkoutPicker((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            selectedWorkoutId
              ? "text-[var(--primary-600)] bg-[var(--primary-50)] dark:bg-[var(--primary-100)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)]"
          }`}
        >
          <Dumbbell className="w-4 h-4" />
          Workout
        </button>
      </div>

      <div className="flex gap-3">
        <Button onClick={handleClose} variant="secondary" block>Cancel</Button>
        <Button onClick={handleSubmit} variant="primary" block disabled={submitting}>
          {submitting ? "Posting…" : "Post"}
        </Button>
      </div>
    </ModalWrapper>
  );
}
