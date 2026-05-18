import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProductCard from "@/components/shop/ProductCard";
import type { Product } from "@/types";

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: "product-1",
    name: "Training Program",
    description: "A structured hypertrophy plan.",
    price_usd: 19.99,
    image_url: "https://example.com/program.png",
    stock_quantity: 12,
    is_physical: false,
    ...overrides,
  };
}

describe("ProductCard", () => {
  it("renders digital product details and invokes buy handler", async () => {
    const user = userEvent.setup();
    const onBuy = vi.fn();
    const item = product();
    render(<ProductCard product={item} onBuy={onBuy} />);

    expect(screen.getByText("Training Program")).toBeInTheDocument();
    expect(screen.getByText("Digital")).toBeInTheDocument();
    expect(screen.getByText("$19.99")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Buy" }));
    expect(onBuy).toHaveBeenCalledWith(item);
  });

  it("shows low-stock and out-of-stock states", async () => {
    const user = userEvent.setup();
    const onBuy = vi.fn();
    const { rerender } = render(<ProductCard product={product({ stock_quantity: 3, is_physical: true })} onBuy={onBuy} />);

    expect(screen.getByText("Physical")).toBeInTheDocument();
    expect(screen.getByText("Only 3 left")).toBeInTheDocument();

    rerender(<ProductCard product={product({ stock_quantity: 0 })} onBuy={onBuy} />);
    const buy = screen.getByRole("button", { name: "Buy" });
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(buy).toBeDisabled();

    await user.click(buy);
    expect(onBuy).not.toHaveBeenCalled();
  });
});
