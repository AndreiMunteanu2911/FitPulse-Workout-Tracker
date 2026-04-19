"use client";

import { useEffect, useState } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { Package, Truck } from "lucide-react";

type AdminOrder = {
  id: string;
  status: string;
  payment_method?: string | null;
  amount_cores?: number | null;
  stripe_session_id?: string | null;
  shipping_address?: unknown;
  created_at?: string;
  product_id?: string | null;
  product?: {
    name: string;
    is_physical: boolean;
  } | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/shop/orders");
        const data = await res.json();
        setOrders(data.orders || []);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <ProtectedWrapper>
        <LoadingSpinner />
      </ProtectedWrapper>
    );
  }

  return (
    <ProtectedWrapper>
      <AdminPageHeader title="Orders" subtitle="Review physical product orders and fulfillment data" />

      <div className="mt-6 hidden overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] md:block">
        <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--surface-raised)]">
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Product</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Method</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Shipping</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Cores</th>
              <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--muted-foreground)]">Stripe Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)]">
                      <Package className="h-4 w-4 text-[var(--primary-600)]" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{order.product?.name || order.product_id || "Unknown product"}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">#{order.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-[var(--foreground)]">{order.payment_method || "unknown"}</td>
                <td className="px-5 py-4 text-sm text-[var(--foreground)]">
                  {order.shipping_address ? (
                    <span className="inline-flex items-center gap-2">
                      <Truck className="h-4 w-4 text-[var(--primary-600)]" />
                      {typeof order.shipping_address === "string"
                        ? order.shipping_address
                        : order.shipping_address && typeof order.shipping_address === "object"
                          ? "Captured"
                          : "Captured"}
                    </span>
                  ) : (
                    "None"
                  )}
                </td>
                <td className="px-5 py-4 text-sm text-[var(--foreground)]">{order.amount_cores ?? "—"}</td>
                <td className="px-5 py-4 text-xs text-[var(--muted-foreground)] break-all">{order.stripe_session_id || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-4 md:hidden">
        {orders.map((order) => (
          <article key={order.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[var(--foreground)]">{order.product?.name || order.product_id || "Unknown product"}</p>
                <p className="text-xs text-[var(--muted-foreground)]">#{order.id}</p>
              </div>
              <span className="text-xs font-semibold text-[var(--muted-foreground)]">{order.payment_method || "unknown"}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-raised)] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Shipping</p>
                <p className="mt-1 text-[var(--foreground)]">{order.shipping_address ? "Captured" : "None"}</p>
              </div>
              <div className="rounded-[var(--radius-sm)] bg-[var(--surface-raised)] p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Cores</p>
                <p className="mt-1 text-[var(--foreground)]">{order.amount_cores ?? "—"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </ProtectedWrapper>
  );
}
