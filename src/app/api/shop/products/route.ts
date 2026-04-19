import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, requireAdmin } from "@/helper/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ products: data });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  try {
    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string | null;
    const priceUsdRaw = formData.get("price_usd") as string | null;
    const priceCoresRaw = formData.get("price_cores") as string | null;
    const stockQuantityRaw = formData.get("stock_quantity") as string | null;
    const image = formData.get("image") as File | null;
    let image_url = formData.get("image_url") as string | null;
    const is_physical = formData.get("is_physical") === "true";

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (image && image.size > 0) {
      const fileName = `products/${Date.now()}-${image.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, image, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(uploadData.path);

      image_url = urlData.publicUrl;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        name,
        description,
        price_usd: priceUsdRaw ? parseFloat(priceUsdRaw) : null,
        price_cores: priceCoresRaw ? parseInt(priceCoresRaw) : null,
        image_url,
        stock_quantity: stockQuantityRaw ? parseInt(stockQuantityRaw) : 0,
        is_physical,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ product: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
