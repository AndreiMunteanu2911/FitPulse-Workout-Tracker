import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import Button from "@/components/Button";
import ModalWrapper from "@/components/ModalWrapper";

interface RoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentRole: "client" | "admin";
  onConfirm: (newRole: "client" | "admin") => void;
  error?: string;
  loading?: boolean;
}

export default function RoleChangeModal({
  isOpen,
  onClose,
  userId,
  currentRole,
  onConfirm,
  error,
  loading,
}: RoleChangeModalProps) {
  const [newRole, setNewRole] = useState<"client" | "admin">(currentRole === "admin" ? "client" : "admin");

  useEffect(() => {
    if (isOpen) {
      setNewRole(currentRole === "admin" ? "client" : "admin");
    }
  }, [currentRole, isOpen]);

  const handleConfirm = () => {
    onConfirm(newRole);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm overflow-hidden p-0">
      <div className="border-b border-[var(--border)] p-6 pr-16">
        <p className="eyebrow">Permissions</p>
        <h2 className="text-xl font-extrabold text-[var(--foreground)]">Change user role</h2>
      </div>
      <button type="button" aria-label="Close role editor" className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-[var(--surface-raised)] text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
      <div className="p-6">
        <p className="mb-4 text-sm text-[var(--muted-foreground)]">
        User: <span className="font-mono text-[var(--foreground)]">{userId.slice(0, 12)}...</span>
      </p>
        {error && (
        <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-sm)] text-sm font-medium">
          {error}
        </div>
      )}
        <div className="mb-5 space-y-3">
        <label className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-raised)] transition-colors">
          <input
            type="radio"
            name="role"
            value="client"
            checked={newRole === "client"}
            onChange={() => setNewRole("client")}
            className="accent-[var(--primary-500)]"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Client</p>
            <p className="text-xs text-[var(--muted-foreground)]">Regular user access</p>
          </div>
        </label>
        <label className="flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-raised)] transition-colors">
          <input
            type="radio"
            name="role"
            value="admin"
            checked={newRole === "admin"}
            onChange={() => setNewRole("admin")}
            className="accent-[var(--primary-500)]"
          />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">Admin</p>
            <p className="text-xs text-[var(--muted-foreground)]">Full platform management</p>
          </div>
        </label>
      </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} block>Cancel</Button>
          <Button onClick={handleConfirm} disabled={loading} block>{loading ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </ModalWrapper>
  );
}
