"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { openCheckoutUrl, isNativePlatform, MOBILE_APP_SCHEME } from "@/lib/mobile";
import { useSearchParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoadReveal from "@/components/LoadReveal";
import { Product } from "@/types";
import { CheckCircle2, ShoppingBag, XCircle } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";
import { PageHeader } from "@/components/PageHeader";


export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled") ?? searchParams.get("canceled");

  useEffect(() => {
    if (success) {
      setMessage({ type: "success", text: "Purchase successful! Thank you for your order." });
    }
    if (cancelled) setMessage({ type: "error", text: "Purchase cancelled." });
  }, [success, cancelled, searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await fetch("/api/shop/products");
      const pData = await pRes.json();
      setProducts(pData.products || []);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const handleProductPurchase = async () => {
      if (!selectedProduct) return;
      setPurchaseLoading(true);

      try {
          const res = await fetch("/api/shop/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: selectedProduct.id,
                method: "stripe",
                nativeApp: isNativePlatform(),
                appScheme: MOBILE_APP_SCHEME,
              }),
          });
          const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;

          if (data?.url) {
              await openCheckoutUrl(data.url);
          } else if (res.ok) {
              setMessage({ type: "success", text: "Purchase successful!" });
              setIsPurchaseModalOpen(false);
              fetchData();
          } else {
              setMessage({ type: "error", text: data?.error || "Failed to complete purchase." });
          }
      } catch (error) {
          setMessage({
            type: "error",
            text: error instanceof Error ? error.message : "An error occurred during purchase.",
          });
      } finally {
          setPurchaseLoading(false);
      }
  };
  if (loading) {
    return (
      <ProtectedWrapper>
        <div className="flex min-h-[18rem] items-center justify-center">
          <LoadingSpinner />
        </div>
      </ProtectedWrapper>
    );
  }

  return (
      <ProtectedWrapper>
        <LoadReveal className="page-stack">
          <PageHeader
            title="Shop"
            description="Training gear and digital tools selected for your next session."
          />

          <AnimatePresence initial={false}>
          {message && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                className={`flex items-center gap-3 rounded-[var(--radius-xl)] border px-5 py-4 shadow-[var(--shadow-xs)] ${
                  message.type === "success"
                      ? "border-[var(--color-success)]/20 bg-[var(--color-success-bg)] text-[var(--color-success)]"
                      : "border-[var(--color-destructive)]/20 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)]"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto rounded-full px-3 py-1 text-xs font-semibold transition-colors hover:bg-black/5">
                  Dismiss
                </button>
              </motion.div>
          )}
          </AnimatePresence>

          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence initial={false} mode="popLayout">
            {products.map((product) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.985 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
              >
                <ProductCard
                    product={product}
                    onBuy={(chosenProduct) => {
                      setSelectedProduct(chosenProduct);
                      setIsPurchaseModalOpen(true);
                    }}
                />
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>

          {products.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon"><ShoppingBag className="size-7" /></div>
                <h3 className="empty-state-title">No products yet</h3>
                <p className="empty-state-description">Check back later for new training gear and tools.</p>
              </div>
          )}
        </LoadReveal>
        <ProductPurchaseModal
            isOpen={isPurchaseModalOpen}
            product={selectedProduct}

            loading={purchaseLoading}
            onClose={() => {
              setIsPurchaseModalOpen(false);
              setSelectedProduct(null);
            }}
            onPurchase={handleProductPurchase}
        />
      </ProtectedWrapper>
  );
}
