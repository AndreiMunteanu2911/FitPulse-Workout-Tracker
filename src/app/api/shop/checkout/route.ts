import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

const DEFAULT_ALLOWED_COUNTRIES = [
  "US",
  "CA",
  "GB",
  "AU",
  "DE",
  "FR",
  "NL",
  "BE",
  "ES",
  "IT",
  "PT",
  "RO",
] as const;

type CheckoutCreateParams = Parameters<typeof stripe.checkout.sessions.create>[0];
type AllowedCountry = (typeof DEFAULT_ALLOWED_COUNTRIES)[number];
type CheckoutCreateParamsWithShipping = NonNullable<CheckoutCreateParams> & {
  shipping_address_collection?: {
    allowed_countries: AllowedCountry[];
  };
};

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { productId?: string; quantity?: number };
  const productId = body.productId;
  const quantity = Number(body.quantity || 1);

  if (!productId || quantity < 1) {
    return NextResponse.json({ error: "Missing productId or invalid quantity." }, { status: 400 });
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (productError || !product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  if (!product.price_usd) {
    return NextResponse.json({ error: "This product cannot be purchased with card." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      product_id: product.id,
      amount_usd: Number(product.price_usd) * quantity,
      status: "pending",
      payment_method: "stripe",
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: orderError?.message || "Failed to create order." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const allowedCountries = (process.env.STRIPE_ALLOWED_SHIPPING_COUNTRIES || "")
    .split(",")
    .map((country) => country.trim().toUpperCase())
    .filter(Boolean) as AllowedCountry[];
  const sessionParams: CheckoutCreateParamsWithShipping = {
    mode: "payment",
    success_url: `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/shop?canceled=1`,
    shipping_address_collection: product.is_physical
      ? {
          allowed_countries: (allowedCountries.length > 0 ? allowedCountries : DEFAULT_ALLOWED_COUNTRIES) as AllowedCountry[],
        }
      : undefined,
    metadata: {
      type: "product-order",
      orderId: order.id,
      productId: product.id,
      userId: user.id,
      quantity: String(quantity),
    },
    line_items: [
      {
        quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(Number(product.price_usd) * 100),
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.image_url ? [product.image_url] : undefined,
          },
        },
      },
    ],
  };

  const session = await stripe.checkout.sessions.create(sessionParams as CheckoutCreateParams);

  const { error: sessionUpdateError } = await supabase
    .from("orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  if (sessionUpdateError) {
    return NextResponse.json({ error: sessionUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, orderId: order.id });
}
