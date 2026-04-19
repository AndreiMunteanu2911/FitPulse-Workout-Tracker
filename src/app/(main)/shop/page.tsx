"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Product } from "@/types";
import { ShoppingBag, CheckCircle2, XCircle } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";


export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

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
              body: JSON.stringify({ productId: selectedProduct.id, method: "stripe" }),
          });
          const data = await res.json();

          if (data.url) {
              window.location.href = data.url;
          } else if (res.ok) {
              setMessage({ type: "success", text: "Purchase successful!" });
              setIsPurchaseModalOpen(false);
              fetchData();
          } else {
              setMessage({ type: "error", text: data.error || "Failed to complete purchase." });
          }
      } catch {
          setMessage({ type: "error", text: "An error occurred during purchase." });
      } finally {
          setPurchaseLoading(false);
      }
  };
  if (loading) return <ProtectedWrapper><LoadingSpinner /></ProtectedWrapper>;

  return (
      <ProtectedWrapper>
        <div className="w-full">
          <div className="page-header mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)] tracking-tight" style={{ fontFamily: "var(--font-poppins)" }}>
                  Shop
                </h1>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                    Everything you need for your workout.
                </p>
              </div>

            </div>
          </div>

          {message && (
              <div className={`mb-6 flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3 ${
                  message.type === "success"
                      ? "border-[var(--color-success)]/20 bg-[var(--color-success-bg)] text-[var(--color-success)]"
                      : "border-[var(--color-destructive)]/20 bg-[var(--color-destructive-bg)] text-[var(--color-destructive)]"
              }`}>
                {message.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="font-medium">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto text-sm font-semibold underline opacity-70 hover:opacity-100">
                  Dismiss
                </button>
              </div>
          )}



          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onBuy={(chosenProduct) => {
                      setSelectedProduct(chosenProduct);
                      setIsPurchaseModalOpen(true);
                    }}
                />
            ))}
          </div>

          {products.length === 0 && (
              <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
                <ShoppingBag className="mx-auto mb-4 h-16 w-16 text-[var(--muted-foreground)] opacity-20" />
                <h3 className="text-xl font-black text-[var(--foreground)]">No products yet</h3>
                <p className="mt-2 text-sm text-[var(--muted-foreground)]">Check back later for new arrivals.</p>
              </div>
          )}
        </div>
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
