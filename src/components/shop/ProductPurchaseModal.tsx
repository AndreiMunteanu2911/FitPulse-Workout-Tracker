"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/Button";
import { X, Gem, CreditCard, Truck } from "lucide-react";
import type { Product } from "@/types";

type ShippingForm = {
  name: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

interface ProductPurchaseModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const emptyShipping: ShippingForm = {
  name: "",
  address_line1: "",
  address_line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "US",
};

export default function ProductPurchaseModal({ isOpen, product, onClose, onSuccess }: ProductPurchaseModalProps) {
  const [shipping, setShipping] = useState<ShippingForm>(emptyShipping);
  const [loading, setLoading] = useState<"stripe" | "cores" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setError("");
      setSuccess("");
      setLoading(null);
      setShipping(emptyShipping);
    }
  }, [isOpen]);

  const requiresShipping = Boolean(product?.is_physical);

  const shippingAddress = useMemo(() => {
    if (!requiresShipping) return null;
    return {
      name: shipping.name,
      address_line1: shipping.address_line1,
      address_line2: shipping.address_line2 || undefined,
      city: shipping.city,
      state: shipping.state,
      postal_code: shipping.postal_code,
      country: shipping.country,
    };
  }, [requiresShipping, shipping]);

  if (!isOpen || !product) return null;

  const handleStripePurchase = async () => {
    setError("");
    setLoading("stripe");
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start checkout.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout.");
      setLoading(null);
    }
  };

  const handleCoresPurchase = async () => {
    setError("");
    setSuccess("");

    if (requiresShipping) {
      const required = [shipping.name, shipping.address_line1, shipping.city, shipping.state, shipping.postal_code];
      if (required.some((value) => !value.trim())) {
        setError("Please fill in the shipping address before paying with Cores.");
        return;
      }
    }

    setLoading("cores");
    try {
      const res = await fetch("/api/shop/cores/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          shippingAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete Cores purchase.");
      setSuccess("Purchase completed with Cores.");
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete Cores purchase.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] p-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--foreground)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="border-b border-[var(--border)] p-5 md:border-b-0 md:border-r">
            <div className="aspect-square overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)]">
              {product.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-[var(--foreground)]">{product.name}</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{product.description}</p>

            <div className="mt-4 flex flex-wrap gap-3">
              {product.price_usd ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)]">
                  <CreditCard className="h-4 w-4 text-[var(--primary-600)]" /> ${product.price_usd}
                </span>
              ) : null}
              {product.price_cores ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-1.5 text-sm font-semibold text-[var(--foreground)]">
                  <Gem className="h-4 w-4 text-[var(--primary-600)]" /> {product.price_cores} Cores
                </span>
              ) : null}
            </div>
          </div>

          <div className="p-5">
            <div className="space-y-4">
              {requiresShipping ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                    <Truck className="h-4 w-4 text-[var(--primary-600)]" />
                    Shipping address
                  </div>
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                    placeholder="Full name"
                    value={shipping.name}
                    onChange={(e) => setShipping((prev) => ({ ...prev, name: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                    placeholder="Address line 1"
                    value={shipping.address_line1}
                    onChange={(e) => setShipping((prev) => ({ ...prev, address_line1: e.target.value }))}
                  />
                  <input
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                    placeholder="Address line 2"
                    value={shipping.address_line2}
                    onChange={(e) => setShipping((prev) => ({ ...prev, address_line2: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                      placeholder="City"
                      value={shipping.city}
                      onChange={(e) => setShipping((prev) => ({ ...prev, city: e.target.value }))}
                    />
                    <input
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                      placeholder="State / Province"
                      value={shipping.state}
                      onChange={(e) => setShipping((prev) => ({ ...prev, state: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                      placeholder="Postal code"
                      value={shipping.postal_code}
                      onChange={(e) => setShipping((prev) => ({ ...prev, postal_code: e.target.value }))}
                    />
                    <input
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary-400)]"
                      placeholder="Country"
                      value={shipping.country}
                      onChange={(e) => setShipping((prev) => ({ ...prev, country: e.target.value }))}
                    />
                  </div>
                </div>
              ) : null}

              {error ? <p className="text-sm font-medium text-[var(--color-destructive)]">{error}</p> : null}
              {success ? <p className="text-sm font-medium text-[var(--primary-600)]">{success}</p> : null}

              <div className="grid gap-3 pt-2 sm:grid-cols-2">
                <Button onClick={handleStripePurchase} disabled={loading !== null || !product.price_usd}>
                  <CreditCard className="h-4 w-4" />
                  Pay with Card
                </Button>
                <Button variant="secondary" onClick={handleCoresPurchase} disabled={loading !== null || !product.price_cores}>
                  <Gem className="h-4 w-4" />
                  {loading === "cores" ? "Confirming..." : "Pay with Cores"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
