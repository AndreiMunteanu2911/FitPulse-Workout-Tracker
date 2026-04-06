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
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
      <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
      <h2 className="text-lg font-bold text-[var(--foreground)] mb-2">{title}</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-5">
        Are you sure you want to delete <strong className="text-[var(--foreground)]">{itemName}</strong>? This cannot be undone.
      </p>
      {error && (
        <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-md)] text-sm font-medium">
          {error}
        </div>
      )}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose} block>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading} block>
          {loading ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </ModalWrapper>
  );
}
