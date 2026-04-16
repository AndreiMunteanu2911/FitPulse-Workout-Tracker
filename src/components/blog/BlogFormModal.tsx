"use client";

import { useState, useRef, useEffect } from "react";
import ModalWrapper from "../ModalWrapper";
import Button from "../Button";
import { ImageIcon, X, Loader2 } from "lucide-react";
import { BlogPost } from "@/types";

interface BlogFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
  initialData?: BlogPost | null;
}

export default function BlogFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: BlogFormModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
      setImageUrl(initialData.image_url || "");
      setPreview(initialData.image_url || null);
    } else {
      setTitle("");
      setContent("");
      setImageUrl("");
      setPreview(null);
    }
    setSelectedFile(null);
  }, [initialData, isOpen]);

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
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (imageUrl) {
        formData.append("image_url", imageUrl);
      }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to save blog post:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-2xl p-6">
      <div className="flex items-center justify-between mb-6 relative">
        <h2 className="text-xl font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
          {initialData ? "Edit Blog Post" : "Create New Blog Post"}
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-[var(--surface-raised)] rounded-full transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Cover Image
          </label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative h-56 rounded-[var(--radius-lg)] overflow-hidden cursor-pointer border-2 border-dashed border-[var(--border)] hover:border-[var(--primary-400)] transition-all group bg-[var(--surface-raised)]"
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <p className="text-white text-sm font-semibold bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">Change Image</p>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-[var(--muted-foreground)]">
                <div className="w-12 h-12 rounded-full bg-[var(--surface)] flex items-center justify-center">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Click to upload cover image</p>
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
          <label className="block mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Title
          </label>
          <input
            required
            className="input w-full"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a catchy title..."
          />
        </div>

        <div>
          <label className="block mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
            Content
          </label>
          <textarea
            required
            rows={10}
            className="input w-full resize-none leading-relaxed"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, tips, or updates..."
          />
        </div>

        <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
          <Button type="button" onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              initialData ? "Update Post" : "Publish Post"
            )}
          </Button>
        </div>
      </form>
    </ModalWrapper>
  );
}
