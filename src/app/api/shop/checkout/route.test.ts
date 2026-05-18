import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { stripe } from "@/helper/stripe";

vi.mock("@/helper/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/config/app-env", () => ({
  getWebAppBaseUrl: vi.fn(() => "https://app.example.com"),
}));

vi.mock("@/helper/stripe", () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

function request(body: unknown) {
  return new Request("http://localhost/api/shop/checkout", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

function builder(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

describe("POST /api/shop/checkout", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
    } as never);

    const response = await POST(request({ productId: "p1", quantity: 1 }));

    expect(response.status).toBe(401);
  });

  it("validates product id and quantity", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
    } as never);

    const response = await POST(request({ quantity: 0 }));

    expect(response.status).toBe(400);
  });

  it("creates an order, Stripe checkout session, and stores the session id", async () => {
    const product = {
      id: "product-1",
      name: "Program",
      description: "Training program",
      price_usd: 19.99,
      image_url: "https://example.com/program.png",
      is_physical: false,
    };
    const productQuery = builder({ data: product, error: null });
    const orderQuery = builder({ data: { id: "order-1" }, error: null });
    const updateQuery = builder({ error: null });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: vi.fn((table: string) => {
        if (table === "products") return productQuery;
        if (table === "orders" && orderQuery.insert.mock.calls.length === 0) return orderQuery;
        return updateQuery;
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
      id: "cs_test_1",
      url: "https://checkout.stripe.com/c/pay/cs_test_1",
    } as never);

    const response = await POST(request({ productId: "product-1", quantity: 2 }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(orderQuery.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-1",
      product_id: "product-1",
      amount_usd: 39.98,
      status: "pending",
      payment_method: "stripe",
    }));
    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      mode: "payment",
      success_url: "https://app.example.com/checkout-success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://app.example.com/shop?canceled=1",
      shipping_address_collection: undefined,
      metadata: expect.objectContaining({
        type: "product-order",
        orderId: "order-1",
        productId: "product-1",
        userId: "user-1",
        quantity: "2",
      }),
    }));
    expect(updateQuery.update).toHaveBeenCalledWith({ stripe_session_id: "cs_test_1" });
    expect(json).toEqual({ url: "https://checkout.stripe.com/c/pay/cs_test_1", orderId: "order-1" });
  });

  it("requires shipping collection for physical products", async () => {
    const productQuery = builder({
      data: { id: "product-1", name: "Shirt", price_usd: 25, is_physical: true },
      error: null,
    });
    const orderQuery = builder({ data: { id: "order-1" }, error: null });
    const updateQuery = builder({ error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: vi.fn((table: string) => {
        if (table === "products") return productQuery;
        if (table === "orders" && orderQuery.insert.mock.calls.length === 0) return orderQuery;
        return updateQuery;
      }),
    } as never);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ id: "cs_test_1", url: "https://checkout.example" } as never);

    await POST(request({ productId: "product-1", quantity: 1 }));

    expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
      shipping_address_collection: {
        allowed_countries: expect.arrayContaining(["US", "RO"]),
      },
    }));
  });

  it("returns 502 when Stripe does not return a checkout URL", async () => {
    const productQuery = builder({ data: { id: "product-1", name: "Program", price_usd: 10 }, error: null });
    const orderQuery = builder({ data: { id: "order-1" }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }) },
      from: vi.fn((table: string) => (table === "products" ? productQuery : orderQuery)),
    } as never);
    vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ id: "cs_test_1" } as never);

    const response = await POST(request({ productId: "product-1", quantity: 1 }));

    expect(response.status).toBe(502);
  });
});
