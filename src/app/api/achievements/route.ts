import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { ACHIEVEMENT_DEFINITIONS } from "@/lib/gamification";

/**
 * POST /api/achievements
 * Body: { achievementId: string }
 *
 * Marks an already-unlocked achievement as claimed:
 *  1. Validates the achievement ID
 *  2. Verifies user_achievements row has status='unlocked' (DB is source of truth)
 *  3. Updates status → 'claimed'
 *  4. Atomically increments user_stats.achievement_xp by the XP reward
 *  5. Returns xpEarned + new achievementXP total so the page can
 *     update in-place without a full reload
 */
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let achievementId: string;
  try {
    ({ achievementId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const definition = ACHIEVEMENT_DEFINITIONS.find((a) => a.id === achievementId);
  if (!definition) {
    return NextResponse.json({ error: "Unknown achievement" }, { status: 404 });
  }

  // Verify the row exists and is claimable (status='unlocked')
  const { data: row, error: fetchError } = await supabase
    .from("user_achievements")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("achievement_id", achievementId)
    .single();

  if (fetchError || !row) {
    return NextResponse.json(
      { error: "Achievement not yet unlocked — complete the required activity first" },
      { status: 403 },
    );
  }

  const achievementRow = row as { id: string; status: string };

  if (achievementRow.status === "claimed") {
    return NextResponse.json({ error: "Achievement already claimed" }, { status: 409 });
  }

  // Mark as claimed
  const claimedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("user_achievements")
    .update({ status: "claimed", claimed_at: claimedAt })
    .eq("id", achievementRow.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Atomically add XP to user_stats (persistent bank, survives achievement row deletions)
  const { error: rpcError } = await supabase.rpc("increment_achievement_xp", {
    p_user_id: user.id,
    p_amount: definition.xpReward,
  });

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  // Return achievement_xp total so page can recompute totalXP without a full reload
  const { data: statsRow } = await supabase
    .from("user_stats")
    .select("achievement_xp")
    .eq("user_id", user.id)
    .single();

  const achievementXP: number =
    (statsRow as { achievement_xp: number } | null)?.achievement_xp ?? definition.xpReward;

  return NextResponse.json({
    success: true,
    achievementId,
    claimedAt,
    xpEarned: definition.xpReward,
    achievementXP,
  });
}
