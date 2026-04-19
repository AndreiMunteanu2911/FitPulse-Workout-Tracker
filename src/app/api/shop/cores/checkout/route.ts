import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { stripe } from "@/helper/stripe";
import { getCorePack } from "@/helper/shop";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cores } = await req.json();
  const coreAmount = Number(cores);
  const pack = getCorePack(coreAmount);

  if (!pack) {
    return NextResponse.json({ error: "Invalid cores pack" }, { status: 400 });
  }

  const origin = req.headers.get("origin");
  if (!origin) {
    return NextResponse.json({ error: "Missing origin" }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${pack.cores} Cores Pack`,
            description: pack.label,
          },
          unit_amount: Math.round(pack.priceUsd * 100),
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/shop?success=true&type=cores&pack=${pack.cores}`,
    cancel_url: `${origin}/shop?cancelled=true&type=cores`,
    customer_email: user.email,
    metadata: {
      type: "cores-pack",
      userId: user.id,
      cores: String(pack.cores),
      priceUsd: String(pack.priceUsd),
    },
  });

  return NextResponse.json({ url: session.url });
}
