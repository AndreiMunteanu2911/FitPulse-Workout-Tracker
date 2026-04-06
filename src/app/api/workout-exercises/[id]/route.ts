import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Step 1: Get the workout_id for this workout_exercise
  const { data: weData } = await supabase
    .from("workout_exercises")
    .select("workout_id")
    .eq("id", id)
    .maybeSingle();

  if (!weData) {
    return NextResponse.json({ error: "Workout exercise not found or unauthorized" }, { status: 404 });
  }

  // Step 2: Check the workout belongs to this user
  const { data: workoutData } = await supabase
    .from("workouts")
    .select("id")
    .eq("id", weData.workout_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workoutData) {
    return NextResponse.json({ error: "Workout exercise not found or unauthorized" }, { status: 404 });
  }

  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
