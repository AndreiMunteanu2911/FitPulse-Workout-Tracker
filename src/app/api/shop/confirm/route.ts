import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";

type CheckoutSessionResponse = {
  id: string;
  payment_status: string | null;
  metadata: Record<string, string> | null;
  shipping_details?: {
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

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  try {
    const checkoutSession = (await stripe.checkout.sessions.retrieve(sessionId)) as unknown as CheckoutSessionResponse;

    return NextResponse.json({
      sessionId: checkoutSession.id,
      paymentStatus: checkoutSession.payment_status,
      metadata: checkoutSession.metadata,
      shippingDetails:
        checkoutSession.collected_information?.shipping_details ??
        checkoutSession.shipping_details ??
        null,
    });
  } catch (error) {
    console.error("[shop-confirm] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load checkout session." },
      { status: 500 },
    );
  }
}
