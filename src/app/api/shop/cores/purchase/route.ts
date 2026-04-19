import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { getSupabaseAdminClient } from "@/helper/supabaseAdmin";
import { fulfillCoresProductOrder } from "@/helper/shopFulfillment";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const productId = body.productId as string | undefined;
  const shippingAddress = body.shippingAddress ?? null;

  if (!productId) {
    return NextResponse.json({ error: "Missing productId." }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdminClient();

  try {
    const result = await fulfillCoresProductOrder(supabaseAdmin, {
      userId: user.id,
      productId,
      shippingAddress,
    });

    if (result.status === "ignored") {
      return NextResponse.json({ error: result.reason }, { status: 400 });
    }

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    console.error("[shop-cores-purchase] failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete Cores purchase." },
      { status: 500 },
    );
  }
}
