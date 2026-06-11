"use client";

import { Product } from "@/types";
import Button from "@/components/Button";
import { ArrowRight, ShoppingBag } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
}

export default function ProductCard({ product, onBuy }: ProductCardProps) {
  return (
    <article className="card-interactive group flex h-full flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-raised)]">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--muted-foreground)]">
            <ShoppingBag className="h-14 w-14 opacity-20" />
          </div>
        )}

        <div className="absolute left-4 top-4 flex gap-2">
          {product.is_physical && <span className="badge badge-accent text-[10px] uppercase tracking-[0.24em]">Physical</span>}
          {!product.is_physical && <span className="badge badge-soft text-[10px] uppercase tracking-[0.24em]">Digital</span>}
        </div>

        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
          <div className="absolute right-4 top-4">
            <span className="badge bg-[var(--color-warning-bg)] text-[var(--color-warning)] text-[10px] uppercase tracking-[0.24em]">
              Only {product.stock_quantity} left
            </span>
          </div>
        )}

        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <span className="rounded-full border border-white/35 px-4 py-2 text-sm font-bold uppercase tracking-[0.28em] text-white">
              Out of stock
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-5 p-5">
        <div>
          <h3 className="line-clamp-1 text-lg font-bold tracking-[-0.02em] text-[var(--foreground)]">{product.name}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--muted-foreground)]">{product.description}</p>
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 border-t border-[var(--border)] pt-4">
          <div>
            <p className="eyebrow !mb-1">Price</p>
            {product.price_usd && <p className="text-2xl font-black leading-none text-[var(--foreground)]">${product.price_usd}</p>}
          </div>

          <Button
            onClick={() => onBuy(product)}
            disabled={product.stock_quantity === 0}
            variant={product.stock_quantity === 0 ? "secondary" : "primary"}
            className="px-4 text-sm sm:px-5 sm:text-sm"
          >
            {product.stock_quantity === 0 ? "Unavailable" : "View"}
            {product.stock_quantity > 0 && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </div>
    </article>
  );
}
