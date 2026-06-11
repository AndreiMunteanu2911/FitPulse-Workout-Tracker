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
      containerClassName="max-w-md overflow-hidden p-0"
    >
      <button
        type="button"
        aria-label="Close bulk update confirmation"
        className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
        onClick={() => {
          if (!isSaving) onClose();
        }}
        disabled={isSaving}
      >
        <X className="w-4 h-4" />
      </button>

      <div className="border-b border-[var(--border)] p-6 pr-16">
        <p className="eyebrow">Bulk update</p>
        <h2 className="text-xl font-extrabold text-[var(--foreground)]">Mark reviews as AI generated?</h2>
      </div>
      <div className="p-6">
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">
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
          variant="primary"
          onClick={onConfirm}
          disabled={isSaving}
          className="flex-1 gap-2"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Confirm
        </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
