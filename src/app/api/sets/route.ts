import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workout_exercise_id, set_number, reps, weight, is_confirmed } = await req.json();

  const { data, error } = await supabase
    .from("sets")
    .insert({
      workout_exercise_id,
      set_number,
      reps: reps ?? 0,
      weight: weight ?? 0,
      is_confirmed: is_confirmed ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ set: data });
}
