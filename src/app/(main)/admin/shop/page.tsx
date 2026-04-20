"use client";

import { useEffect, useState } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import Button from "@/components/Button";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Product } from "@/types";
import { Plus, Package, ShoppingBag, Trash2, Edit2 } from "lucide-react";
import ProductFormModal from "@/components/shop/ProductFormModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import ConfirmDeleteModal from "@/components/admin/ConfirmDeleteModal";

export default function AdminShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  const handleCreateProduct = async (formData: FormData) => {
    const res = await fetch("/api/shop/products", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create product.");
    }

    fetchProducts();
  };

  const handleUpdateProduct = async (formData: FormData, productId?: string) => {
    if (!productId) throw new Error("Missing product ID.");

    const payload = new FormData();
    payload.append("id", productId);
    formData.forEach((value, key) => payload.append(key, value));

    const res = await fetch("/api/shop/products", {
      method: "PUT",
      body: payload,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update product.");
    }

    fetchProducts();
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return;
    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch(`/api/shop/products?id=${deletingProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete product.");
      }
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  const totalProducts = products.length;
  const physicalProducts = products.filter((product) => product.is_physical).length;
  const digitalProducts = totalProducts - physicalProducts;

  if (loading) return <ProtectedWrapper><LoadingSpinner /></ProtectedWrapper>;

  return (
    <ProtectedWrapper>
      <div className="w-full">
        <AdminPageHeader
          title="Shop"
          subtitle="Add products and manage store inventory"
          action={
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-5 w-5" />
              Add Product
            </Button>
          }
        />

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Products</p>
            <p className="mt-3 text-3xl font-black text-[var(--foreground)]">{totalProducts}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Physical</p>
            <p className="mt-3 text-3xl font-black text-[var(--foreground)]">{physicalProducts}</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Digital</p>
            <p className="mt-3 text-3xl font-black text-[var(--foreground)]">{digitalProducts}</p>
          </div>
        </div>

        <div className="mt-6 hidden overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] md:block">
          <table className="w-full table-fixed text-left">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Product</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Prices</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Inventory</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Type</th>
                <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--surface-raised)] border border-[var(--border)] overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] opacity-30">
                            <ShoppingBag className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--foreground)] truncate">{product.name}</p>
                        <p className="text-xs text-[var(--muted-foreground)] truncate">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {product.price_usd && <p className="text-sm font-medium text-[var(--foreground)]">${product.price_usd}</p>}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--foreground)]">{product.stock_quantity} in stock</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                      product.is_physical
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      {product.is_physical ? "Physical" : "Digital"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1 sm:gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="group p-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--primary-600)]"
                        aria-label={`Edit ${product.name}`}
                      >
                        <Edit2 className="h-4 w-4 transition-colors group-hover:text-[var(--primary-600)]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingProduct(product);
                          setDeleteError("");
                        }}
                        className="group p-2 text-[var(--muted-foreground)] transition-colors hover:text-[var(--color-destructive)]"
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4 transition-colors group-hover:text-[var(--color-destructive)]" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {products.length === 0 && (
            <div className="p-12 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-[var(--muted-foreground)] opacity-20" />
              <p className="text-[var(--muted-foreground)]">No products in the database yet.</p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4 md:hidden">
          {products.map((product) => (
            <article key={product.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
              <div className="flex items-start gap-3">
                <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)]">
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)] opacity-30">
                      <ShoppingBag className="h-5 w-5" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-bold text-[var(--foreground)]">{product.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--muted-foreground)]">{product.description}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter ${
                      product.is_physical
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                    }`}>
                      {product.is_physical ? "Physical" : "Digital"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-raised)] px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Price</p>
                      <div className="mt-1 space-y-1">
                        {product.price_usd && <p className="text-sm font-medium text-[var(--foreground)]">${product.price_usd}</p>}
                      </div>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-raised)] px-3 py-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Stock</p>
                      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{product.stock_quantity}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(product)}
                      className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary-400)] hover:text-[var(--primary-600)]"
                    >
                      <Edit2 className="h-4 w-4 transition-colors group-hover:text-[var(--primary-600)]" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeletingProduct(product);
                        setDeleteError("");
                      }}
                      className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-raised)] px-3 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--color-destructive)] hover:text-[var(--color-destructive)]"
                    >
                      <Trash2 className="h-4 w-4 transition-colors group-hover:text-[var(--color-destructive)]" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}

          {products.length === 0 && (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface)] p-10 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-[var(--muted-foreground)] opacity-20" />
              <p className="text-[var(--muted-foreground)]">No products in the database yet.</p>
            </div>
          )}
        </div>

        <ProductFormModal
          isOpen={isAddModalOpen || !!editingProduct}
          product={editingProduct}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingProduct(null);
          }}
          onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        />

        <ConfirmDeleteModal
          isOpen={!!deletingProduct}
          onClose={() => {
            setDeletingProduct(null);
            setDeleteError("");
          }}
          title="Delete Product"
          itemName={deletingProduct?.name || ""}
          onConfirm={handleDeleteProduct}
          error={deleteError}
          loading={deleting}
        />
      </div>
    </ProtectedWrapper>
  );
}
