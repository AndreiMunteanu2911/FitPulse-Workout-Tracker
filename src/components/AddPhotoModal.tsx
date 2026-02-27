"use client";

import { useState, useRef } from "react";
import ModalWrapper from "./ModalWrapper";
import Button from "./Button";

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (photo: File, logDate: string, notes: string) => Promise<void>;
}

export default function AddPhotoModal({ isOpen, onClose, onAdd }: AddPhotoModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logDate, setLogDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setSubmitting(true);
    try {
      await onAdd(selectedFile, logDate, notes);
      resetForm();
    } catch (error) {
      console.error("Failed to add photo:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview(null);
    setLogDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} containerClassName="max-w-md p-6">
      <h2 className="text-xl font-bold mb-4 text-[var(--foreground)]">Add Progress Photo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm text-[var(--foreground)]">Photo</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[var(--border)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--primary-500)] transition"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="max-h-48 mx-auto rounded" />
            ) : (
              <div className="py-8">
                <svg className="w-12 h-12 mx-auto text-[var(--muted-foreground)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-[var(--muted-foreground)]">Click to select a photo</p>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-[var(--foreground)]">Date</label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--foreground)]"
            required
          />
        </div>

        <div>
          <label className="block mb-1 text-sm text-[var(--foreground)]">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your progress..."
            rows={3}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--foreground)] resize-none"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="button" onClick={handleClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="flex-1"
            disabled={!selectedFile || submitting}
          >
            {submitting ? "Adding..." : "Add Photo"}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
