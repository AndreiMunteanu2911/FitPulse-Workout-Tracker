import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workout_exercise_id, set_number, reps, weight, is_confirmed } = await req.json();

  // Verify the workout_exercise belongs to the user's workout
  const { data: weData } = await supabase
    .from("workout_exercises")
    .select("id, workouts!inner(user_id)")
    .eq("id", workout_exercise_id)
    .eq("workouts.user_id", user.id)
    .maybeSingle();

  if (!weData) {
    return NextResponse.json({ error: "Workout exercise not found or unauthorized" }, { status: 404 });
  }

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
