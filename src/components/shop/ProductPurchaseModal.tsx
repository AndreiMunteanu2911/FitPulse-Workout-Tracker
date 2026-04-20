"use client";

import { Product } from "@/types";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import { ShoppingBag, X } from "lucide-react";

interface ProductPurchaseModalProps {
    isOpen: boolean;
    product: Product | null;
    loading: boolean;
    onClose: () => void;
    onPurchase: () => void;
}

export default function ProductPurchaseModal({
                                                 isOpen,
                                                 product,
                                                 loading,
                                                 onClose,
                                                 onPurchase,
                                             }: ProductPurchaseModalProps) {
    if (!product) return null;

    return (
        <ModalWrapper isOpen={isOpen} onClose={() => !loading && onClose()} containerClassName="max-w-2xl max-h-[calc(100vh-1.5rem)] overflow-y-auto overflow-hidden p-0">
            <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 z-20 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-raised)]"
            >
                <X className="h-4 w-4" />
            </button>
            <div className="grid md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-72 bg-[var(--surface-raised)]">
                    {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full min-h-72 items-center justify-center text-[var(--muted-foreground)]">
                            <ShoppingBag className="h-16 w-16 opacity-20" />
                        </div>
                    )}
                    <div className="absolute left-4 top-4 flex gap-2">
                        {product.is_physical ? (
                            <span className="badge badge-accent text-[10px] uppercase tracking-[0.24em]">Physical</span>
                        ) : (
                            <span className="badge badge-soft text-[10px] uppercase tracking-[0.24em]">Digital</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col bg-[var(--surface)]">
                    <div className="border-b border-[var(--border)] p-6">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Confirm purchase</p>
                        <h2 className="mt-2 text-xl font-extrabold text-[var(--foreground)]">{product.name}</h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{product.description}</p>
                    </div>

                    <div className="space-y-4 p-6">
                        <div className="grid gap-3">
                            {product.price_usd && (
                                <button
                                    onClick={onPurchase}
                                    disabled={loading}
                                    className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] p-4 text-left transition-colors hover:border-[var(--primary-400)] disabled:opacity-50"
                                >
                                    <div>
                                        <p className="font-semibold text-[var(--foreground)]">Pay with card</p>
                                        <p className="text-xs text-[var(--muted-foreground)]">Secure checkout powered by Stripe</p>
                                    </div>
                                    <p className="text-base font-bold text-[var(--foreground)]">${product.price_usd}</p>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto border-t border-[var(--border)] p-6">
                        <Button variant="secondary" onClick={onClose} block disabled={loading}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
}
