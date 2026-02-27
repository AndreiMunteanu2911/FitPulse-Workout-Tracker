import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

const BATCH_SIZE = 20;

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "0");
  const search = searchParams.get("search") ?? "";
  const bodyPart = searchParams.get("bodyPart") ?? "";
  const muscle = searchParams.get("muscle") ?? "";
  const equipment = searchParams.get("equipment") ?? "";
  const favoritesOnly = searchParams.get("favorites") === "true";

  // Get user favorite exercise IDs if filtering by favorites
  let favoriteExerciseIds: string[] = [];
  if (favoritesOnly) {
    const { data: favs } = await supabase
      .from("user_exercises")
      .select("exercise_id")
      .eq("user_id", user.id)
      .eq("is_favorite", true);
    favoriteExerciseIds = favs?.map(f => f.exercise_id) || [];
  }

  let query = supabase.from("exercises").select("*");

  // Apply filters
  if (bodyPart) query = query.ilike("body_parts", "%" + bodyPart + "%");
  if (muscle) query = query.ilike("target_muscles", "%" + muscle + "%");
  if (equipment) query = query.ilike("equipments", "%" + equipment + "%");
  if (favoritesOnly && favoriteExerciseIds.length > 0) {
    query = query.in("id", favoriteExerciseIds);
  } else if (favoritesOnly) {
    return NextResponse.json({ exercises: [], hasMore: false });
  }

  let data, error;
  if (search.trim() === "") {
    const res = await query.range(page * BATCH_SIZE, (page + 1) * BATCH_SIZE - 1);
    data = res.data ?? [];
    error = res.error;
  } else {
    const words = search.trim().toLowerCase().split(/\s+/);
    const res = await query;
    data = res.data ?? [];
    error = res.error;
    data = data.filter((e: { name?: string }) => {
      const name = (e.name || "").toLowerCase();
      return words.every((word) => name.includes(word));
    });
    data = data.slice(page * BATCH_SIZE, (page + 1) * BATCH_SIZE);
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const processed = data.map((e: { name?: string }) => ({
    ...e,
    name: e.name ? e.name.charAt(0).toUpperCase() + e.name.slice(1) : e.name,
  }));

  return NextResponse.json({ exercises: processed, hasMore: processed.length === BATCH_SIZE });
}
