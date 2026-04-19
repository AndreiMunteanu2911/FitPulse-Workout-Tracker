"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import { Product } from "@/types";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: FormData, productId?: string) => Promise<void>;
  product?: Product | null;
}

export default function ProductFormModal({ isOpen, onClose, onSubmit, product }: ProductFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [isPhysical, setIsPhysical] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setName(product?.name || "");
    setDescription(product?.description || "");
    setPriceUsd(product?.price_usd?.toString() || "");

    setStockQuantity(product?.stock_quantity?.toString() || "0");
    setIsPhysical(product?.is_physical || false);
    setImageUrl(product?.image_url || "");
    setSelectedFile(null);
    setPreview(product?.image_url || null);
    setError("");
  }, [isOpen, product]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setImageUrl("");

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("price_usd", priceUsd);
      formData.append("stock_quantity", stockQuantity);
      formData.append("is_physical", String(isPhysical));
      if (selectedFile) {
        formData.append("image", selectedFile);
      } else if (imageUrl) {
        formData.append("image_url", imageUrl);
      }

      await onSubmit(formData, product?.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} containerClassName="max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-y-auto p-0">
      <div className="p-6 border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Shop admin</p>
            <h2 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">
              {product ? "Edit product" : "Add new product"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--surface-raised)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 p-6">
        {error && (
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-destructive)]/20 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm font-medium text-[var(--color-destructive)]">
            {error}
          </div>
        )}

        <div className="grid gap-5">
          <div className="grid gap-2">
            <label className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Cover Image</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group relative min-h-48 cursor-pointer overflow-hidden rounded-[var(--radius-md)] border-2 border-dashed border-[var(--border)] bg-[var(--surface-raised)] transition-colors hover:border-[var(--primary-400)]"
            >
              {preview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/25 opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-black/40 px-4 py-2 text-sm font-semibold text-white">
                      Change Image
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center text-[var(--muted-foreground)]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)]">
                    <ImageIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--foreground)]">Click to upload product image</p>
                    <p className="mt-1 text-xs">PNG, JPG, or WebP. Stored in Supabase Storage.</p>
                  </div>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2 grid gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Product Name</label>
              <input className="input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="FitPulse T-Shirt" />
            </div>

            <div className="md:col-span-2 grid gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Description</label>
              <textarea
                className="input min-h-28 resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what makes this product special..."
              />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Price (USD)</label>
              <input className="input" type="number" step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} placeholder="0.00" />
            </div>

            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Stock Quantity</label>
              <input className="input" type="number" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
            </div>

              <label className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3">
              <input
                type="checkbox"
                checked={isPhysical}
                onChange={(e) => setIsPhysical(e.target.checked)}
                className="h-5 w-5 accent-[var(--primary-500)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--foreground)]">Physical product</span>
                <span className="block text-xs text-[var(--muted-foreground)]">Enables shipping flow for card purchases.</span>
              </span>
            </label>

            <div className="md:col-span-2 grid gap-2">
              <label className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                <span className="inline-flex items-center gap-2">
                  <Upload className="h-3.5 w-3.5" />
                  Fallback Image URL
                </span>
              </label>
              <input
                className="input"
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value) {
                    setSelectedFile(null);
                    setPreview(null);
                  }
                }}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          <div className="flex gap-3 border-t border-[var(--border)] pt-5">
            <Button type="button" variant="secondary" onClick={onClose} block disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" block disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                product ? "Save Changes" : "Create Product"
              )}
            </Button>
          </div>
        </div>
      </form>
    </ModalWrapper>
  );
}
