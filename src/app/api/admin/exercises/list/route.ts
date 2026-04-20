// ── Admin: List All Exercises (with form_rules) ─────────────────────────────
// GET /api/admin/exercises — Fetch all standard exercises for form rules review
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/helper/supabaseServer";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;
  void req;

  const query = supabase
    .from("exercises")
    .select("exercise_id, name, target_muscles, body_parts, equipments, instructions, form_rules", { count: "exact" })
    .not("exercise_id", "like", "custom_%")
    .order("name")
    .limit(5000);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Capitalize names
  const exercises = (data ?? []).map((e: { name?: string }) => ({
    ...e,
    name: e.name ? e.name.charAt(0).toUpperCase() + e.name.slice(1) : e.name,
  }));

  return NextResponse.json({ exercises });
}
