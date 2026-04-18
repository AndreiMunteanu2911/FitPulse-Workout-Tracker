import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";
import { supabaseAdmin } from "@/helper/supabaseAdmin";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") as string;

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret || "");
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const orderId = session.metadata.orderId;

    // Update order status
    const { data: order, error: oError } = await supabaseAdmin
      .from("orders")
      .update({ 
        status: "completed",
        shipping_address: session.shipping_details
      })
      .eq("id", orderId)
      .select()
      .single();

    if (oError) {
        console.error("Error updating order:", oError);
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
