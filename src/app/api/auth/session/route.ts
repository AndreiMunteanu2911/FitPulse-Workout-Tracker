import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ user: null }, { status: 401 });

  // Fetch the user's profile data from user_stats
  const { data: profileData } = await supabase
    .from("user_stats")
    .select("role, onboarding_done, display_name, birthday, gender, height_cm")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: profileData?.role ?? "client",
      onboarding_done: profileData?.onboarding_done ?? false,
      display_name: profileData?.display_name ?? null,
      birthday: profileData?.birthday ?? null,
      gender: profileData?.gender ?? null,
      height_cm: profileData?.height_cm ?? null,
    },
  });
}
