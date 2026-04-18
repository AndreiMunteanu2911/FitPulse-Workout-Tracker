"use client";

import { useEffect, useState } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Product } from "@/types";
import { Plus, Package, ShoppingBag, Trash2, Edit2, Star, DollarSign, Image as ImageIcon } from "lucide-react";
import ModalWrapper from "@/components/ModalWrapper";

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price_usd: "",
    price_cores: "",
    image_url: "",
    stock_quantity: "0",
    is_physical: false,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/shop/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/shop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price_usd: formData.price_usd ? parseFloat(formData.price_usd) : null,
          price_cores: formData.price_cores ? parseInt(formData.price_cores) : null,
          stock_quantity: parseInt(formData.stock_quantity),
        }),
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setFormData({
          name: "",
          description: "",
          price_usd: "",
          price_cores: "",
          image_url: "",
          stock_quantity: "0",
          is_physical: false,
        });
        fetchProducts();
      }
    } catch (error) {
      console.error("Error adding product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <ProtectedWrapper><LoadingSpinner /></ProtectedWrapper>;

  return (
    <ProtectedWrapper>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--foreground)] flex items-center gap-3">
              <Package className="w-8 h-8 text-[var(--primary-500)]" />
              Manage Shop
            </h1>
            <p className="text-[var(--muted-foreground)] mt-1">Add products and manage inventory.</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Product
          </Button>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Prices</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Inventory</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--surface-raised)] border border-[var(--border)] overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] opacity-30">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[var(--foreground)]">{product.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] line-clamp-1 max-w-[200px]">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      {product.price_usd && <p className="text-sm font-medium text-[var(--foreground)]">${product.price_usd}</p>}
                      {product.price_cores && (
                        <p className="text-xs font-bold text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" /> {product.price_cores}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${product.stock_quantity > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                       <span className="text-sm font-medium text-[var(--foreground)]">{product.stock_quantity} in stock</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                      product.is_physical 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {product.is_physical ? 'Physical' : 'Digital'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-[var(--muted-foreground)] hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {products.length === 0 && (
            <div className="p-12 text-center">
               <Package className="w-12 h-12 text-[var(--muted-foreground)] mx-auto mb-3 opacity-20" />
               <p className="text-[var(--muted-foreground)]">No products in the database yet.</p>
            </div>
          )}
        </div>

        <ModalWrapper 
          isOpen={isAddModalOpen} 
          onClose={() => !isSubmitting && setIsAddModalOpen(false)}
          containerClassName="max-w-xl p-0"
        >
          <div className="p-6 border-b border-[var(--border)]">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">Add New Product</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-[var(--foreground)]">Product Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 focus:ring-2 focus:ring-[var(--primary-500)] outline-none"
                  placeholder="e.g. FitPulse T-Shirt"
                />
              </div>
              
              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-[var(--foreground)]">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 focus:ring-2 focus:ring-[var(--primary-500)] outline-none min-h-[100px]"
                  placeholder="Tell us about the product..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" /> Price (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price_usd}
                  onChange={(e) => setFormData({ ...formData, price_usd: e.target.value })}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 focus:ring-2 focus:ring-[var(--primary-500)] outline-none"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" /> Price (Cores)
                </label>
                <input
                  type="number"
                  value={formData.price_cores}
                  onChange={(e) => setFormData({ ...formData, price_cores: e.target.value })}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 focus:ring-2 focus:ring-[var(--primary-500)] outline-none"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1.5 text-center">
                 <label className="text-sm font-bold text-[var(--foreground)]">Stock Quantity</label>
                 <input
                  required
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 focus:ring-2 focus:ring-[var(--primary-500)] outline-none"
                />
              </div>

              <div className="space-y-1.5 flex flex-col justify-end">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)]">
                  <input
                    type="checkbox"
                    checked={formData.is_physical}
                    onChange={(e) => setFormData({ ...formData, is_physical: e.target.checked })}
                    className="w-5 h-5 accent-[var(--primary-500)]"
                  />
                  <span className="text-sm font-bold text-[var(--foreground)]">Physical Product</span>
                </label>
              </div>

              <div className="col-span-2 space-y-1.5">
                <label className="text-sm font-bold text-[var(--foreground)] flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5" /> Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-[var(--surface-raised)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-2 focus:ring-2 focus:ring-[var(--primary-500)] outline-none"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button 
                type="button"
                variant="secondary" 
                block
                onClick={() => setIsAddModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                block
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </form>
        </ModalWrapper>
      </div>
    </ProtectedWrapper>
  );
}
