import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { stripe } from "@/helper/stripe";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { productId, paymentMethod, shippingAddress } = await req.json();

  const { data: product, error: pError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (pError || !product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (product.stock_quantity <= 0) {
    return NextResponse.json({ error: "Product out of stock" }, { status: 400 });
  }

  if (paymentMethod === "cores") {
    if (!product.price_cores) {
      return NextResponse.json({ error: "Product cannot be bought with cores" }, { status: 400 });
    }

    const { data: stats } = await supabase
      .from("user_stats")
      .select("cores_balance")
      .eq("user_id", user.id)
      .single();

    if ((stats?.cores_balance || 0) < product.price_cores) {
      return NextResponse.json({ error: "Insufficient cores" }, { status: 400 });
    }

    // Process transaction
    const { error: tError } = await supabase.from("premium_currency_transactions").insert({
      user_id: user.id,
      amount: -product.price_cores,
      type: "purchase",
      description: `Purchase: ${product.name}`,
    });

    if (tError) return NextResponse.json({ error: tError.message }, { status: 500 });

    // Update stock
    await supabase.from("products").update({
      stock_quantity: product.stock_quantity - 1
    }).eq("id", product.id);

    // Create order
    const { data: order, error: oError } = await supabase.from("orders").insert({
      user_id: user.id,
      product_id: product.id,
      amount_cores: product.price_cores,
      status: "completed",
      shipping_address: shippingAddress,
    }).select().single();

    if (oError) return NextResponse.json({ error: oError.message }, { status: 500 });

    return NextResponse.json({ success: true, order });
  } else if (paymentMethod === "stripe") {
    if (!product.price_usd) {
      return NextResponse.json({ error: "Product cannot be bought with USD" }, { status: 400 });
    }

    // Create pending order
    const { data: order, error: oError } = await supabase.from("orders").insert({
      user_id: user.id,
      product_id: product.id,
      amount_usd: product.price_usd,
      status: "pending",
      shipping_address: shippingAddress,
    }).select().single();

    if (oError) return NextResponse.json({ error: oError.message }, { status: 500 });

    const origin = req.headers.get("origin");

    // Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.name,
              description: product.description || undefined,
              images: product.image_url ? [product.image_url] : undefined,
            },
            unit_amount: Math.round(product.price_usd * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/shop?success=true&orderId=${order.id}`,
      cancel_url: `${origin}/shop?cancelled=true`,
      customer_email: user.email,
      metadata: {
        orderId: order.id,
        userId: user.id,
        productId: product.id,
      },
      shipping_address_collection: product.is_physical ? {
        allowed_countries: ["US", "CA", "GB"], // Adjust as needed
      } : undefined,
    });

    // Update order with session ID
    await supabase.from("orders").update({
        stripe_session_id: session.id
    }).eq("id", order.id);

    return NextResponse.json({ url: session.url });
  }

  return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
}
