import React, { useState } from "react";
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

  const handleConfirm = () => {
    onConfirm(newRole);
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-sm p-6">
      <button className="absolute top-3 right-3 w-8 h-8 rounded-full hover:bg-[var(--surface-raised)] flex items-center justify-center" onClick={onClose}>
        <X className="w-4 h-4" />
      </button>
      <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Change User Role</h2>
      <p className="text-sm text-[var(--muted-foreground)] mb-4">
        User: <span className="font-mono text-[var(--foreground)]">{userId.slice(0, 12)}...</span>
      </p>
      {error && (
        <div className="mb-3 p-3 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)] rounded-[var(--radius-md)] text-sm font-medium">
          {error}
        </div>
      )}
      <div className="space-y-3 mb-5">
        <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-raised)] transition-colors">
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
        <label className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] border border-[var(--border)] cursor-pointer hover:bg-[var(--surface-raised)] transition-colors">
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
    </ModalWrapper>
  );
}
