import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";
import { getSupabaseAdminClient } from "@/helper/supabaseAdmin";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdminClient();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret || "");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook Error";
    console.error(`Webhook Error: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id?: string;
      metadata?: Record<string, string>;
      shipping_details?: unknown;
    };
    const metadataType = session.metadata?.type;

    if (metadataType === "cores-pack") {
      const coresAmount = Number(session.metadata?.cores || 0);
      const userId = session.metadata?.userId;
      const stripeSessionId = session.id;

      if (userId && coresAmount > 0 && stripeSessionId) {
        await supabaseAdmin.from("premium_currency_transactions").upsert({
          user_id: userId,
          amount: coresAmount,
          type: "top_up",
          description: `Cores pack purchase: +${coresAmount} Cores`,
          stripe_session_id: stripeSessionId,
        } as never, {
          onConflict: "stripe_session_id",
          ignoreDuplicates: true,
        });
      }
      return NextResponse.json({ received: true });
    }

    const orderId = session.metadata?.orderId;
    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    // Update order status
    const { data: order, error: oError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "completed",
        shipping_address: session.shipping_details
      })
      .neq("status", "completed")
      .eq("id", orderId)
      .select()
      .maybeSingle();

    if (oError) {
        console.error("Error updating order:", oError);
    } else if (!order) {
        return NextResponse.json({ received: true });
    } else {
        // Update stock
        const { data: product } = await supabaseAdmin
            .from("products")
            .select("stock_quantity")
            .eq("id", order.product_id)
            .single();

        if (product) {
            await supabaseAdmin.from("products").update({
                stock_quantity: Math.max(0, product.stock_quantity - 1)
            }).eq("id", order.product_id);
        }
    }
  }

  return NextResponse.json({ received: true });
}
