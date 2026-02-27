import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

const BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "0");
  const search = searchParams.get("search") ?? "";

  let data, error;
  if (search.trim() === "") {
    const res = await supabase
      .from("exercises")
      .select("*")
      .range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);
    data = res.data ?? [];
    error = res.error;
  } else {
    const words = search.trim().toLowerCase().split(/\s+/);
    const res = await supabase.from("exercises").select("*");
    data = res.data ?? [];
    error = res.error;
    data = data.filter((e: { name?: string }) => {
      const name = (e.name || "").toLowerCase();
      return words.every((word) => name.includes(word));
    });
    data = data.slice(page * BATCH_SIZE, (page + 1) * BATCH_SIZE);
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const processed = data.map((e: { name?: string }) => ({
    ...e,
    name: e.name ? e.name.charAt(0).toUpperCase() + e.name.slice(1) : e.name,
  }));

  return NextResponse.json({ exercises: processed, hasMore: data.length === BATCH_SIZE });
}
