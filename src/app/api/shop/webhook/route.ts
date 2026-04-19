import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";
import { getSupabaseAdminClient } from "@/helper/supabaseAdmin";
import { fulfillStripeProductOrder } from "@/helper/shopFulfillment";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as {
      id?: string;
      payment_status?: string | null;
      metadata?: Record<string, string> | null;
      shipping_details?: unknown;
      customer_details?: unknown;
    };

    const checkoutSession = session.id
      ? await stripe.checkout.sessions.retrieve(session.id)
      : session;

    if (checkoutSession.metadata?.type === "product-order") {
      try {
        const result = await fulfillStripeProductOrder(supabaseAdmin, checkoutSession as never);
        console.log("[shop-webhook] product fulfilled", result);
      } catch (error) {
        console.error("[shop-webhook] product fulfillment failed", error);
        return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
