"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import ModalWrapper from "@/components/ModalWrapper";
import Button from "@/components/Button";
import { ArrowRight, CreditCard, LockKeyhole, PackageCheck, ShoppingBag, X } from "lucide-react";

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
    const [imageLoaded, setImageLoaded] = useState(false);

    useEffect(() => {
        setImageLoaded(false);
    }, [product?.image_url]);

    if (!product) return null;

    return (
        <ModalWrapper isOpen={isOpen} onClose={() => !loading && onClose()} containerClassName="max-w-2xl max-h-[calc(100dvh-1rem)] overflow-y-auto p-0">
            <button
                type="button"
                onClick={onClose}
                disabled={loading}
                aria-label="Close purchase"
                className="absolute right-4 top-4 z-20 rounded-full border border-[var(--border)] bg-[var(--surface)] p-2 text-[var(--foreground)] transition-colors hover:bg-[var(--surface-raised)]"
            >
                <X className="h-4 w-4" />
            </button>
            <div className="grid md:grid-cols-[0.9fr_1.1fr]">
                <div className="relative h-44 bg-[var(--surface-raised)] sm:h-56 md:h-auto md:min-h-[28rem]">
                    {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className={`h-full w-full object-cover transition-opacity duration-200 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
                            onLoad={() => setImageLoaded(true)}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">
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

                <div className="flex flex-col bg-[var(--surface)] p-5 sm:p-7">
                    <div>
                        <p className="eyebrow">Confirm purchase</p>
                        <h2 className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--foreground)]">{product.name}</h2>
                        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{product.description}</p>
                    </div>

                    <div className="my-6 space-y-3">
                        <div className="flex items-center justify-between rounded-[var(--radius-lg)] bg-[var(--surface-raised)] p-4">
                            <div>
                                <p className="eyebrow !mb-1">Total</p>
                                <p className="text-xs text-[var(--muted-foreground)]">Taxes calculated at checkout</p>
                            </div>
                            <p className="text-2xl font-black text-[var(--foreground)]">${product.price_usd}</p>
                        </div>
                        <div className="grid gap-2 text-sm text-[var(--muted-foreground)]">
                            <p className="flex items-center gap-2"><CreditCard className="size-4 text-[var(--primary-500)]" />Card payment through Stripe</p>
                            <p className="flex items-center gap-2"><LockKeyhole className="size-4 text-[var(--primary-500)]" />Secure hosted checkout</p>
                            {product.is_physical && (
                                <p className="flex items-center gap-2"><PackageCheck className="size-4 text-[var(--primary-500)]" />Shipping details collected at checkout</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-auto grid gap-2">
                        <Button onClick={onPurchase} block disabled={loading}>
                            {loading ? "Opening checkout..." : `Continue for $${product.price_usd}`}
                            {!loading && <ArrowRight className="size-4" />}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            block
                            disabled={loading}
                            className="hover:!translate-y-0 hover:!shadow-[var(--shadow-xs)]"
                        >
                            Keep browsing
                        </Button>
                    </div>
                </div>
            </div>
        </ModalWrapper>
    );
}
