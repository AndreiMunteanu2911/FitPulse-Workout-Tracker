// ── Admin: Exercise Management ──────────────────────────────────────────────
// POST /api/admin/exercises — Insert a standard exercise
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const body = await req.json();
  const { exercise_id, name, gif_url, target_muscles, body_parts, equipments } = body;

  if (!exercise_id || !name) {
    return NextResponse.json({ error: "exercise_id and name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert({ exercise_id, name, gif_url: gif_url ?? null, target_muscles: target_muscles ?? null, body_parts: body_parts ?? null, equipments: equipments ?? null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ exercise: data });
}
