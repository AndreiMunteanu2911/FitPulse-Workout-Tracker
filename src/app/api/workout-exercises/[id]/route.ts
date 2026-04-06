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

  // Verify the workout_exercise belongs to the user's workout
  const { data: weData } = await supabase
    .from("workout_exercises")
    .select("id")
    .eq("id", id)
    .eq("workouts.user_id", user.id)
    .maybeSingle();

  if (!weData) {
    return NextResponse.json({ error: "Workout exercise not found or unauthorized" }, { status: 404 });
  }

  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
