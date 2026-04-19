"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Product, GamificationStats } from "@/types";
import { ShoppingBag, Gem, CheckCircle2, XCircle } from "lucide-react";
import ProductCard from "@/components/shop/ProductCard";
import ProductPurchaseModal from "@/components/shop/ProductPurchaseModal";
import Button from "@/components/Button";
import { CORE_PACKS } from "@/helper/shop";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    const isCoreTopUp = searchParams.get("type") === "cores";
    if (success && isCoreTopUp) {
      const pack = searchParams.get("pack");
      setMessage({ type: "success", text: `Cores pack${pack ? ` (${pack})` : ""} purchased successfully.` });
    } else if (success) {
      setMessage({ type: "success", text: "Purchase successful! Thank you for your order." });
    }
    if (cancelled) setMessage({ type: "error", text: "Purchase cancelled." });
  }, [success, cancelled, searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, gRes] = await Promise.all([
        fetch("/api/shop/products"),
        fetch("/api/gamification")
      ]);
      const pData = await pRes.json();
      const gData = await gRes.json();
      setProducts(pData.products || []);
      setGamification(gData.gamification || null);
    } catch (error) {
      console.error("Error fetching shop data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBuyCores = async (cores: number) => {
    setPurchaseLoading(true);
    try {
      const res = await fetch("/api/shop/cores/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cores }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setMessage({ type: "error", text: data.error || "Failed to start Cores purchase." });
      }
    } catch {
      setMessage({ type: "error", text: "An error occurred." });
    } finally {
      setPurchaseLoading(false);
    }
  };

  // Logic for purchasing a specific product
  const handleProductPurchase = async (method: "stripe" | "cores") => {
    if (!selectedProduct) return;
    setPurchaseLoading(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: selectedProduct.id, method }),
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
                  Gear, rewards, and Cores in one place.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2">
                <Gem className="h-4 w-4 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
                <p className="text-sm font-semibold text-[var(--foreground)]">
                  {gamification?.cores_balance || 0} <span className="text-[var(--muted-foreground)]">Cores</span>
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

          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)]" style={{ fontFamily: "var(--font-poppins)" }}>
                  Buy Cores
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">Top up your balance with a simple Stripe checkout.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {CORE_PACKS.map((pack) => (
                  <div key={pack.cores} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">{pack.label}</p>
                        <h3 className="mt-2 text-2xl font-black text-[var(--foreground)]">{pack.cores} Cores</h3>
                      </div>
                      <Gem className="h-6 w-6 text-[var(--primary-600)] dark:text-[var(--primary-400)]" />
                    </div>

                    <p className="mb-5 text-sm text-[var(--muted-foreground)]">
                      Instant top-up for your in-app balance.
                    </p>

                    <div className="flex items-center justify-between gap-3">
                      <p className="text-lg font-bold text-[var(--foreground)]">${pack.priceUsd.toFixed(2)}</p>
                      <Button onClick={() => handleBuyCores(pack.cores)} disabled={purchaseLoading} className="px-5">
                        Buy
                      </Button>
                    </div>
                  </div>
              ))}
            </div>
          </div>

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
            coresBalance={gamification?.cores_balance || 0}
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