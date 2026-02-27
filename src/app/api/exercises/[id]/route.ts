import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("exercise_id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  return NextResponse.json({ exercise: data });
}
