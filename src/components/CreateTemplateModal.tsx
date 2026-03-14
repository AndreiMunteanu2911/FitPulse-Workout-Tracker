"use client";

import { useState, useEffect } from "react";
import ModalWrapper from "./ModalWrapper";
import Button from "./Button";
import { useExercises } from "@/hooks/useExercises";
import type { WorkoutTemplate } from "@/types";
import { Check } from "lucide-react";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string, exerciseIds: string[]) => void;
  template?: WorkoutTemplate | null;
}

export default function CreateTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  template,
}: CreateTemplateModalProps) {
  const { fetchExercises } = useExercises();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setName(template.name);
      setDescription(template.description || "");
      setSelectedExercises(
        template.template_exercises?.map((te) => te.exercise_id) || []
      );
    } else {
      setName("");
      setDescription("");
      setSelectedExercises([]);
    }
  }, [template, isOpen]);

  useEffect(() => {
    if (isOpen && searchQuery) {
      const timer = setTimeout(() => {
        loadExercises(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else if (isOpen && !searchQuery) {
      loadExercises("");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, isOpen]);

  const loadExercises = async (query: string) => {
    try {
      setLoading(true);
      const result = await fetchExercises(0, query);
      setExercises(result.exercises || []);
    } catch (error) {
      console.error("Failed to load exercises:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name, description, selectedExercises);
    resetForm();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setSelectedExercises([]);
    setSearchQuery("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} containerClassName="max-w-2xl p-6 max-h-[90vh] overflow-hidden flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">
        {template ? "Edit Template" : "Create Template"}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
        <div className="space-y-4 mb-4">
          <div>
            <label className="block mb-1 text-sm text-[var(--foreground)]">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Upper Body Day"
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--foreground)]"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-sm text-[var(--foreground)]">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template..."
              rows={2}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--foreground)] resize-none"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-sm text-[var(--foreground)]">Select Exercises</label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--foreground)]"
          />
        </div>

        <div className="flex-1 overflow-auto mb-4 border border-[var(--border)] rounded-lg p-3">
          {loading ? (
            <div className="text-center text-[var(--muted-foreground)] py-4">Loading exercises...</div>
          ) : exercises.length === 0 ? (
            <div className="text-center text-[var(--muted-foreground)] py-4">No exercises found</div>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise) => {
                const isSelected = selectedExercises.includes(exercise.exercise_id);
                return (
                  <div
                    key={exercise.exercise_id}
                    onClick={() => toggleExercise(exercise.exercise_id)}
                    className={`flex items-center gap-3 p-3 rounded-[var(--radius-md)] cursor-pointer transition ${
                      isSelected
                        ? "bg-[var(--primary-50)] border border-[var(--primary-500)]"
                        : "bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary-300)]"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? "bg-[var(--primary-500)] border-[var(--primary-500)]"
                          : "border-[var(--border)]"
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    {exercise.gif_url && (
                      <img src={exercise.gif_url} alt="" className="w-10 h-10 object-contain rounded" />
                    )}
                    <span className="text-[var(--foreground)]">{exercise.name}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={handleClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={!name.trim() || selectedExercises.length === 0}
          >
            {template ? "Update Template" : "Create Template"}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
