import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("workouts")
    .select(`*, workout_exercises (*, exercise:exercises (*), sets (*))`)
    .eq("user_id", user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ workout: null });

  const workout = {
    ...data,
    workout_exercises: (data.workout_exercises ?? [])
      .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
      .map((we: { sets: { set_number: number }[] }) => ({
        ...we,
        sets: (we.sets ?? []).sort((a, b) => a.set_number - b.set_number),
      })),
  };

  return NextResponse.json({ workout });
}
