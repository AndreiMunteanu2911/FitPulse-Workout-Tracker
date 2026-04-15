import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { resolveExercises } from "@/helper/resolveExercises";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: postsData, error } = await supabase
    .from("posts")
    .select(`
      *,
      user_stats(display_name),
      post_likes(id, user_id),
      post_comments(id, user_id, content, created_at, user_stats(display_name))
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const posts = postsData || [];

  const workoutIds = [...new Set(posts.map((p) => p.workout_id).filter(Boolean))] as string[];

  const workoutMap = new Map<string, unknown>();
  if (workoutIds.length > 0) {
    const { data: workoutsData } = await supabase
      .from("workouts")
      .select("*, workout_exercises(*, sets(*))")
      .in("id", workoutIds);

    if (workoutsData) {
      const allExerciseIds = [
        ...new Set(
          workoutsData.flatMap((w) =>
            (w.workout_exercises ?? []).map((we: { exercise_id: string }) => we.exercise_id)
          )
        ),
      ];
      const exerciseMap = await resolveExercises(supabase, allExerciseIds);

      for (const workout of workoutsData) {
        workoutMap.set(workout.id, {
          ...workout,
          workout_exercises: (workout.workout_exercises ?? [])
            .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
            .map((we: { exercise_id: string; sets: { set_number: number }[] }) => ({
              ...we,
              exercise: exerciseMap.get(we.exercise_id) ?? {
                exercise_id: we.exercise_id,
                name: we.exercise_id,
                is_custom: false,
              },
              sets: (we.sets ?? []).sort((a, b) => a.set_number - b.set_number),
            })),
        });
      }
    }
  }

  const enriched = posts.map((post) => ({
    ...post,
    likes_count: (post.post_likes ?? []).length,
    comments_count: (post.post_comments ?? []).length,
    liked_by_me: (post.post_likes ?? []).some((l: { user_id: string }) => l.user_id === user.id),
    workout: post.workout_id ? workoutMap.get(post.workout_id) ?? null : null,
  }));

  return NextResponse.json({ posts: enriched });
}
