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

    if (session.metadata?.type === "cores-pack") {
      const userId = session.metadata?.userId;
      const coresAmount = Number(session.metadata?.cores || 0);

      if (userId && coresAmount > 0 && session.id) {
        const { data: existing, error: existingError } = await supabaseAdmin
          .from("premium_currency_transactions")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (existingError) {
          console.error("[shop-webhook] cores top-up lookup failed", existingError);
          return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
        }

        if (!existing) {
          const { error: insertError } = await supabaseAdmin.from("premium_currency_transactions").insert({
            user_id: userId,
            amount: coresAmount,
            type: "top_up",
            description: `Cores pack purchase: +${coresAmount} Cores`,
            stripe_session_id: session.id,
          });

          if (insertError) {
            console.error("[shop-webhook] cores top-up insert failed", insertError);
            return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
          }

          const { data: statsRow, error: statsError } = await supabaseAdmin
            .from("user_stats")
            .select("cores_balance")
            .eq("user_id", userId)
            .maybeSingle();

          if (statsError) {
            console.error("[shop-webhook] cores top-up stats lookup failed", statsError);
            return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
          }

          const currentBalance = Number(statsRow?.cores_balance || 0);
          const { error: updateError } = await supabaseAdmin
            .from("user_stats")
            .upsert({
              user_id: userId,
              cores_balance: currentBalance + coresAmount,
            }, { onConflict: "user_id" });

          if (updateError) {
            console.error("[shop-webhook] cores top-up balance update failed", updateError);
            return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
          }
        }
      }
    }

    if (session.metadata?.type === "product-order") {
      try {
        const result = await fulfillStripeProductOrder(supabaseAdmin, session as never);
        console.log("[shop-webhook] product fulfilled", result);
      } catch (error) {
        console.error("[shop-webhook] product fulfillment failed", error);
        return NextResponse.json({ error: "Webhook fulfillment failed." }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
