"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/Button";
import { Package, ShoppingBag } from "lucide-react";

type ConfirmResponse = {
  paymentStatus?: string | null;
  metadata?: Record<string, string> | null;
  shippingDetails?: unknown;
  error?: string;
};

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const [loading, setLoading] = useState(Boolean(sessionId));

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      try {
        const res = await fetch(`/api/shop/confirm?session_id=${encodeURIComponent(sessionId)}`);
        const data = (await res.json()) as ConfirmResponse;
        if (!cancelled) {
          setResult(data);
        }
      } catch (error) {
        if (!cancelled) {
          setResult({
            error: error instanceof Error ? error.message : "Failed to load purchase details.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadSession();

    const timeout = window.setTimeout(() => {
      router.replace("/shop");
    }, 3500);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [router, sessionId]);

  const summary = useMemo(() => {
    if (result?.metadata?.type === "product-order") {
      return {
        title: "Order complete",
        description: "Your product purchase was successful.",
        icon: <Package className="h-6 w-6 text-[var(--primary-600)]" />,
      };
    }

    return {
      title: "Purchase complete",
      description: "Your checkout finished successfully.",
      icon: <ShoppingBag className="h-6 w-6 text-[var(--primary-600)]" />,
    };
  }, [result?.metadata]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center px-4 py-10">
      <div className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-raised)]">
            {summary.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">Checkout success</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[var(--foreground)]">{summary.title}</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">
              {loading ? "Loading your purchase details..." : summary.description}
            </p>
            {result?.paymentStatus && result.paymentStatus !== "paid" ? (
              <p className="mt-3 text-sm font-medium text-[var(--color-destructive)]">
                Payment status: {result.paymentStatus}
              </p>
            ) : null}
            {result?.error ? (
              <p className="mt-3 text-sm font-medium text-[var(--color-destructive)]">{result.error}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/shop">Back to shop</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
        {!loading && !result?.error ? (
          <p className="mt-4 text-xs text-[var(--muted-foreground)]">
            You will be redirected to the shop shortly.
          </p>
        ) : null}
      </div>
    </main>
  );
}
