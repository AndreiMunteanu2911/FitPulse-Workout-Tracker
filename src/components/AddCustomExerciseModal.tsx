import React, { useState, useEffect } from "react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import { X, Plus } from "lucide-react";

const BODY_PARTS = [
  "back",
  "cardio",
  "chest",
  "lower arms",
  "lower legs",
  "neck",
  "shoulders",
  "upper arms",
  "upper legs",
  "waist",
];

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, bodyPart: string) => Promise<void>;
  initialName?: string;
}

const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
}) => {
  const [name, setName] = useState(initialName);
  const [bodyPart, setBodyPart] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync name field with initialName whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setBodyPart("");
      setError("");
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Exercise name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");
    
    try {
      await onSubmit(trimmedName, bodyPart);
      setName("");
      setBodyPart("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setBodyPart("");
    setError("");
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} containerClassName="max-w-sm p-6">
      <button
        className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-[var(--muted-foreground)] hover:bg-[var(--surface-raised)] transition-colors"
        onClick={handleClose}
        aria-label="Close"
        type="button"
      >
        <X className="w-4 h-4" />
      </button>

      <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Create Custom Exercise</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Exercise Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            className="input"
            placeholder="e.g., Cable Flyes"
            autoFocus
            maxLength={100}
          />
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Body Part <span className="normal-case font-normal">(optional)</span>
          </label>
          <select
            value={bodyPart}
            onChange={(e) => setBodyPart(e.target.value)}
            className="input w-full"
          >
            <option value="">— Select body part —</option>
            {BODY_PARTS.map((bp) => (
              <option key={bp} value={bp}>
                {bp.charAt(0).toUpperCase() + bp.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <Button 
            type="button" 
            variant="secondary" 
            className="flex-1"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            className="flex-1"
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? (
              "Creating..."
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                Create
              </>
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
};

export default AddCustomExerciseModal;
