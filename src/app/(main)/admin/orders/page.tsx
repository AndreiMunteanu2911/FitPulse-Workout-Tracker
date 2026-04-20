"use client";

import { useEffect, useState } from "react";
import ProtectedWrapper from "@/components/ProtectedWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { CheckCircle2, Clock3, Package, RefreshCw, Truck, XCircle } from "lucide-react";

type AdminOrder = {
  id: string;
  status: string;
  payment_method?: string | null;
  amount_usd?: number | null;
  created_at?: string;
  updated_at?: string;
  stripe_session_id?: string | null;
  product_id?: string | null;
  product?: {
    name: string;
    is_physical: boolean;
  } | null;
  shipping_address?: unknown;
};

type Status = "pending" | "completed" | "shipped" | "cancelled";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadOrders = async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }

    setError("");

    try {
      const res = await fetch("/api/shop/orders");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders.");
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const updateStatus = async (id: string, status: Status) => {
    setSavingId(id);
    setError("");

    try {
      const res = await fetch("/api/shop/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update order.");
      await loadOrders({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order.");
    } finally {
      setSavingId(null);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle2 className="h-4 w-4" />;
    if (status === "shipped") return <Truck className="h-4 w-4" />;
    if (status === "cancelled") return <XCircle className="h-4 w-4" />;
    return <Clock3 className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <ProtectedWrapper>
        <LoadingSpinner />
      </ProtectedWrapper>
    );
  }

  return (
    <ProtectedWrapper>
      <AdminPageHeader
        title="Orders"
        subtitle="Review orders, update fulfillment status, and inspect shipping details"
        action={
          <button
            type="button"
            onClick={() => loadOrders()}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-raised)]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-destructive)]/20 bg-[var(--color-destructive-bg)] px-4 py-3 text-sm font-medium text-[var(--color-destructive)]">
          {error}
        </div>
      )}

      {orders.length > 0 ? (
        <div className="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {orders.map((order) => {
            const orderStatus = (["pending", "completed", "shipped", "cancelled"] as const).includes(order.status as Status)
              ? (order.status as Status)
              : "pending";

            return (
              <article
                key={order.id}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-[var(--foreground)]">
                      {order.product?.name || order.product_id || "Unknown product"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">#{order.id}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-raised)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--foreground)]">
                    {statusIcon(orderStatus)}
                    {orderStatus}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Method</p>
                      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">{order.payment_method || "unknown"}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Total</p>
                      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                        {typeof order.amount_usd === "number" ? `$${order.amount_usd.toFixed(2)}` : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-raised)] p-3 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Shipping</p>
                      <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                        {order.shipping_address ? "Captured" : "None"}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Stripe Session</p>
                      <p className="mt-1 break-all text-sm font-medium text-[var(--foreground)]">
                        {order.stripe_session_id || "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => updateStatus(order.id, "pending")}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-raised)] disabled:opacity-50"
                  >
                    Pending
                  </button>
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => updateStatus(order.id, "completed")}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-raised)] disabled:opacity-50"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => updateStatus(order.id, "shipped")}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-raised)] disabled:opacity-50"
                  >
                    Ship
                  </button>
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-destructive)] transition-colors hover:bg-[var(--color-destructive-bg)] disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <Package className="mx-auto mb-4 h-14 w-14 text-[var(--muted-foreground)] opacity-20" />
          <h3 className="text-xl font-black text-[var(--foreground)]">No orders yet</h3>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Orders will appear here after customers complete checkout.</p>
        </div>
      )}
    </ProtectedWrapper>
  );
}
