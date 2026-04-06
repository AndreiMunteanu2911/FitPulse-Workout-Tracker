import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

// Verify that a set belongs to the authenticated user's workout
async function verifySetOwnership(supabase: any, userId: string, setId: string) {
  const { data } = await supabase
    .from("sets")
    .select("id")
    .eq("id", setId)
    .eq("workout_exercise.workouts.user_id", userId)
    .maybeSingle();
  return data;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const set = await verifySetOwnership(supabase, user.id, id);
  if (!set) return NextResponse.json({ error: "Set not found or unauthorized" }, { status: 404 });

  const body = await req.json();
  const updates: { reps?: number; weight?: number; is_confirmed?: boolean } = {};
  if (body.reps !== undefined) updates.reps = body.reps;
  if (body.weight !== undefined) updates.weight = body.weight;
  if (body.is_confirmed !== undefined) updates.is_confirmed = body.is_confirmed;

  const { error } = await supabase.from("sets").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify ownership
  const set = await verifySetOwnership(supabase, user.id, id);
  if (!set) return NextResponse.json({ error: "Set not found or unauthorized" }, { status: 404 });

  const { error } = await supabase.from("sets").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
