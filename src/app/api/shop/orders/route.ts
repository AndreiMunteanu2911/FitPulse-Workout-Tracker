import { NextResponse } from "next/server";
import { requireAdmin } from "@/helper/supabaseServer";

export async function GET() {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const productIds = [...new Set((orders || []).map((order) => order.product_id).filter(Boolean))];
  const { data: products } = productIds.length
    ? await supabase.from("products").select("id, name, is_physical").in("id", productIds)
    : { data: [] };

  const productMap = new Map((products || []).map((product) => [product.id, product]));
  const normalizedOrders = (orders || [])
    .map((order) => ({
      ...order,
      product: productMap.get(order.product_id) || null,
    }))
    .filter((order) => order.product?.is_physical !== false);

  return NextResponse.json({ orders: normalizedOrders });
}
