import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/helper/stripe";
import { getCorePack } from "@/helper/shop";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[shop-cores-checkout] unauthorized", {
      hasUser: Boolean(user),
      error: userError?.message,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { cores?: number };
  const cores = Number(body.cores || 0);
  const corePack = getCorePack(cores);

  if (!corePack) {
    console.warn("[shop-cores-checkout] invalid cores pack", { userId: user.id, cores });
    return NextResponse.json({ error: "Invalid Cores pack." }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;

  console.log("[shop-cores-checkout] creating session", {
    userId: user.id,
    cores: corePack.cores,
    priceUsd: corePack.priceUsd,
    baseUrl,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}&type=cores&pack=${corePack.cores}`,
    cancel_url: `${baseUrl}/shop?canceled=1`,
    metadata: {
      type: "cores-pack",
      userId: user.id,
      cores: String(corePack.cores),
      priceUsd: String(corePack.priceUsd),
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          product_data: {
            name: `${corePack.cores} Cores`,
            description: corePack.label,
          },
          unit_amount: Math.round(corePack.priceUsd * 100),
        },
      },
    ],
  });

  console.log("[shop-cores-checkout] created session", {
    userId: user.id,
    sessionId: session.id,
    url: session.url,
  });

  return NextResponse.json({ url: session.url });
}
