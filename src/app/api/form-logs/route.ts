// ── Form Score Logging ──────────────────────────────────────────────────────
// POST /api/form-logs — Log a form checking session
// GET  /api/form-logs?exerciseId=xxx — Get form history for an exercise
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { exercise_id, score, reps, duration_ms, feedback_notes } = body;

  if (!exercise_id || score === undefined) {
    return NextResponse.json({ error: "exercise_id and score are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("form_logs")
    .insert({
      user_id: user.id,
      exercise_id,
      score,
      reps: reps ?? 0,
      duration_ms: duration_ms ?? 0,
      feedback_notes: feedback_notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ log: data });
}

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const exerciseId = searchParams.get("exerciseId");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  let query = supabase
    .from("form_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (exerciseId) {
    query = query.eq("exercise_id", exerciseId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}
