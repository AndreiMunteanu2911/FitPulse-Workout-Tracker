import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";
import { getSupabaseAdminClient } from "@/helper/supabaseAdmin";
import { fulfillStripeProductOrder } from "@/helper/shopFulfillment";

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

type CheckoutSessionLike = {
  id?: string;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
  payment_intent?: string | {
    id?: string;
    shipping?: { name?: string | null; address?: unknown } | null;
    latest_charge?: { shipping?: { address?: unknown } | null } | null;
  } | null;
  shipping_details?: {
    name?: string | null;
    address?: unknown;
  } | null;
  customer_details?: {
    name?: string | null;
    address?: unknown;
  } | null;
  collected_information?: {
    shipping_details?: {
      name?: string | null;
      address?: unknown;
    } | null;
  } | null;
};

type PaymentIntentLike = {
  id?: string;
  shipping?: { name?: string | null; address?: unknown } | null;
  latest_charge?: { shipping?: { address?: unknown } | null } | null;
};

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
    const session = event.data.object as CheckoutSessionLike;

    const checkoutSession = session.id
      ? ((await stripe.checkout.sessions.retrieve(session.id)) as unknown as CheckoutSessionLike)
      : session;

    const paymentIntent: PaymentIntentLike | null =
      typeof checkoutSession.payment_intent === "string"
        ? ((await stripe.paymentIntents.retrieve(checkoutSession.payment_intent, { expand: ["latest_charge"] })) as unknown as PaymentIntentLike)
        : (checkoutSession.payment_intent as PaymentIntentLike | null) ?? null;

    if (checkoutSession.metadata?.type === "product-order") {
      try {
        await fulfillStripeProductOrder(supabaseAdmin, checkoutSession as never, paymentIntent as never);
      } catch (error) {
        console.error("[shop-webhook] product fulfillment failed", error);
        return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
