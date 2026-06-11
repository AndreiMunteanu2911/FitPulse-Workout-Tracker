import React from "react";
import { X } from "lucide-react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  itemName: string;
  onConfirm: () => void;
  error?: string;
  loading?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  title,
  itemName,
  onConfirm,
  error,
  loading,
}: ConfirmDeleteModalProps) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm overflow-hidden p-0">
      <div className="border-b border-[var(--border)] p-6 pr-16">
        <p className="eyebrow">Confirmation</p>
        <h2 className="text-xl font-extrabold text-[var(--foreground)]">{title}</h2>
      </div>
      <button type="button" aria-label="Close confirmation" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
      <div className="p-6">
        <p className="mb-5 text-sm leading-6 text-[var(--muted-foreground)]">
        Are you sure you want to delete <strong className="text-[var(--foreground)]">{itemName}</strong>? This cannot be undone.
      </p>
        {error && (
          <div className="mb-3 rounded-[var(--radius-sm)] bg-[var(--color-destructive-bg)] p-3 text-sm font-medium text-[var(--color-destructive)]">
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} block>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading} block>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
