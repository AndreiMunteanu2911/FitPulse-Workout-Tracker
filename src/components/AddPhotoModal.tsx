"use client";

import { useState, useRef } from "react";
import ModalWrapper from "./ModalWrapper";
import Button from "./Button";
import { ImageIcon } from "lucide-react";

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
      reader.onloadend = () => setPreview(reader.result as string);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={handleClose} containerClassName="max-w-md p-6">
      <h2 className="text-lg font-bold text-[var(--foreground)] mb-5">Add Progress Photo</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Photo</label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative rounded-[var(--radius-lg)] overflow-hidden cursor-pointer border-2 border-dashed border-[var(--border)] hover:border-[var(--primary-400)] transition-colors"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full max-h-52 object-cover" />
            ) : (
              <div className="py-10 flex flex-col items-center gap-2 text-[var(--muted-foreground)]">
                <ImageIcon className="w-10 h-10" />
                <p className="text-sm font-medium">Tap to select a photo</p>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Date</label>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="block mb-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">Notes <span className="font-normal normal-case tracking-normal">(optional)</span></label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your progress..."
            rows={3}
            className="input resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" onClick={handleClose} variant="secondary" className="flex-1">Cancel</Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={!selectedFile || submitting}>
            {submitting ? "Adding..." : "Add Photo"}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
