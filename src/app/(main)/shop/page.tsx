"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Product, GamificationStats } from "@/types";
import { ShoppingBag, Star, Info, CheckCircle2, XCircle } from "lucide-react";
import ModalWrapper from "@/components/ModalWrapper";

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [gamification, setGamification] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  useEffect(() => {
    if (success) setMessage({ type: 'success', text: "Purchase successful! Thank you for your order." });
    if (cancelled) setMessage({ type: 'error', text: "Purchase cancelled." });
  }, [success, cancelled]);

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

  const handlePurchase = async (method: 'stripe' | 'cores') => {
    if (!selectedProduct) return;
    setPurchaseLoading(true);
    try {
      const res = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          paymentMethod: method,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else if (data.success) {
        setMessage({ type: 'success', text: "Purchase successful!" });
        setSelectedProduct(null);
        fetchData();
      } else {
        setMessage({ type: 'error', text: data.error || "Purchase failed." });
      }
    } catch (error) {
        setMessage({ type: 'error', text: "An error occurred." });
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) return <ProtectedWrapper><LoadingSpinner /></ProtectedWrapper>;

  return (
    <ProtectedWrapper>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-[var(--primary-500)]" />
              FitPulse Shop
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1">
              Get exclusive gear and power up with Cores.
            </p>
          </div>
          
          <div className="bg-[var(--surface-raised)] p-4 rounded-[var(--radius-lg)] border border-[var(--border)] flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted-foreground)] uppercase font-bold tracking-wider">Your Balance</p>
                <p className="text-xl font-black text-[var(--foreground)]">{gamification?.cores_balance || 0} <span className="text-sm font-medium text-[var(--muted-foreground)]">Cores</span></p>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-[var(--radius-md)] flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            <span className="font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-sm underline opacity-70 hover:opacity-100">Dismiss</button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden flex flex-col hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="aspect-square bg-[var(--surface-raised)] relative overflow-hidden group">
                {product.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)]">
                    <ShoppingBag className="w-16 h-16 opacity-20" />
                  </div>
                )}
                {product.is_physical && (
                  <div className="absolute top-3 left-3 bg-[var(--primary-500)] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                    Physical
                  </div>
                )}
                {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">
                    Only {product.stock_quantity} left
                  </div>
                )}
                {product.stock_quantity === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white font-bold uppercase tracking-widest text-lg border-2 border-white/50 px-4 py-2">Out of Stock</span>
                  </div>
                )}
              </div>
              
              <div className="p-5 flex flex-col flex-1">
                <h3 className="text-xl font-bold text-[var(--foreground)] mb-2 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)] mb-6 line-clamp-2 flex-1">{product.description}</p>
                
                <div className="flex items-center justify-between gap-4 mt-auto">
                  <div className="space-y-1">
                    {product.price_usd && (
                      <p className="text-lg font-bold text-[var(--foreground)]">${product.price_usd}</p>
                    )}
                    {product.price_cores && (
                      <p className="flex items-center gap-1.5 text-sm font-bold text-yellow-600 dark:text-yellow-500">
                        <Star className="w-4 h-4 fill-current" />
                        {product.price_cores} Cores
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => setSelectedProduct(product)}
                    disabled={product.stock_quantity === 0}
                    variant={product.stock_quantity === 0 ? "secondary" : "primary"}
                    className="px-6"
                  >
                    Buy
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-20 bg-[var(--surface)] rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border)]">
             <ShoppingBag className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4 opacity-20" />
             <h3 className="text-xl font-bold text-[var(--foreground)]">No products yet</h3>
             <p className="text-[var(--muted-foreground)]">Check back later for new arrivals!</p>
          </div>
        )}

        <ModalWrapper 
          isOpen={!!selectedProduct} 
          onClose={() => !purchaseLoading && setSelectedProduct(null)}
          containerClassName="max-w-md p-0 overflow-hidden"
        >
          {selectedProduct && (
            <div className="flex flex-col">
              <div className="p-6 border-b border-[var(--border)]">
                <h2 className="text-2xl font-bold text-[var(--foreground)] mb-1">Confirm Purchase</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{selectedProduct.name}</p>
              </div>
              
              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--foreground)]">Choose your payment method:</p>
                
                <div className="grid grid-cols-1 gap-3">
                  {selectedProduct.price_usd && (
                    <button
                      onClick={() => handlePurchase('stripe')}
                      disabled={purchaseLoading}
                      className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] border-2 border-[var(--border)] hover:border-[var(--primary-500)] hover:bg-[var(--primary-50)] dark:hover:bg-[var(--primary-900)]/10 transition-all text-left group disabled:opacity-50"
                    >
                      <div>
                        <p className="font-bold text-[var(--foreground)] group-hover:text-[var(--primary-700)] dark:group-hover:text-[var(--primary-400)]">Pay with Card</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Secure payment via Stripe</p>
                      </div>
                      <p className="text-lg font-black text-[var(--foreground)]">${selectedProduct.price_usd}</p>
                    </button>
                  )}
                  
                  {selectedProduct.price_cores && (
                    <button
                      onClick={() => handlePurchase('cores')}
                      disabled={purchaseLoading || (gamification?.cores_balance || 0) < selectedProduct.price_cores}
                      className="flex items-center justify-between p-4 rounded-[var(--radius-lg)] border-2 border-[var(--border)] hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-all text-left group disabled:opacity-50"
                    >
                      <div>
                        <p className="font-bold text-[var(--foreground)] group-hover:text-yellow-700 dark:group-hover:text-yellow-500">Pay with Cores</p>
                        <p className="text-xs text-[var(--muted-foreground)]">Balance: {gamification?.cores_balance || 0}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-lg font-black text-yellow-600 dark:text-yellow-500">
                        <Star className="w-5 h-5 fill-current" />
                        {selectedProduct.price_cores}
                      </div>
                    </button>
                  )}
                </div>

                {(gamification?.cores_balance || 0) < (selectedProduct.price_cores || 0) && selectedProduct.price_cores && (
                  <div className="flex items-start gap-2 p-3 bg-blue-500/10 rounded-[var(--radius-md)]">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                      You need {selectedProduct.price_cores - (gamification?.cores_balance || 0)} more Cores. Keep training and completing achievements to earn more!
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-[var(--surface-raised)] border-t border-[var(--border)] flex justify-end">
                <Button 
                  variant="secondary" 
                  onClick={() => setSelectedProduct(null)}
                  disabled={purchaseLoading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </ModalWrapper>
      </div>
    </ProtectedWrapper>
  );
}
