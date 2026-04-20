"use client";

import { Loader2, Sparkles, X } from "lucide-react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";

interface BulkAiGeneratedConfirmModalProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function BulkAiGeneratedConfirmModal({
  isOpen,
  isSaving,
  onClose,
  onConfirm,
}: BulkAiGeneratedConfirmModalProps) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      containerClassName="max-w-md p-6"
    >
      <button
        className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center"
        onClick={() => {
          if (!isSaving) onClose();
        }}
        disabled={isSaving}
      >
        <X className="w-4 h-4" />
      </button>

      <h2 className="text-lg font-bold text-[var(--foreground)]">Mark all needs review as AI Generated?</h2>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
        This will update every exercise that currently has `needs_review` status. Exercises without form rules will be
        skipped.
      </p>

      <div className="mt-5 flex gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isSaving}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={isSaving}
          className="flex-1 gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Confirm
        </Button>
      </div>
    </ModalWrapper>
  );
}
