import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: workoutId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { exercise_id, order_index } = await req.json();

  // Custom exercises (exercise_id = "custom_<uuid>") must exist in the exercises table
  // to satisfy the FK constraint. Upsert the exercise data if it is not already there.
  if (exercise_id && exercise_id.startsWith("custom_")) {
    const customUUID = exercise_id.replace("custom_", "");
    const { data: customExercise } = await supabase
      .from("custom_exercises")
      .select("name, body_part")
      .eq("id", customUUID)
      .single();

    if (!customExercise) {
      return NextResponse.json({ error: "Custom exercise not found" }, { status: 404 });
    }

    const { error: upsertError } = await supabase
      .from("exercises")
      .upsert(
        {
          exercise_id,
          name: customExercise.name,
          body_parts: customExercise.body_part ?? null,
        },
        { onConflict: "exercise_id" }
      );

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }
  }

  const { data: workoutExerciseData, error: exerciseError } = await supabase
    .from("workout_exercises")
    .insert({ workout_id: workoutId, exercise_id, order_index })
    .select()
    .single();

  if (exerciseError) return NextResponse.json({ error: exerciseError.message }, { status: 500 });

  const { data: setData, error: setError } = await supabase
    .from("sets")
    .insert({ workout_exercise_id: workoutExerciseData.id, set_number: 1, reps: 0, weight: 0 })
    .select()
    .single();

  if (setError) return NextResponse.json({ error: setError.message }, { status: 500 });

  return NextResponse.json({ workoutExercise: workoutExerciseData, set: setData });
}
