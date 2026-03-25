import React, { useState } from "react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";
import { X, Plus } from "lucide-react";

interface AddCustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
  initialName?: string;
}

const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialName = "",
}) => {
  const [name, setName] = useState(initialName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
      await onSubmit(trimmedName);
      setName("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create exercise");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
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
