import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function POST(req: NextRequest) {
  const { email, password, display_name } = await req.json();
  const supabase = await createSupabaseServerClient();

  // Sign up the user
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // If signup succeeded and we have a session (no email confirmation required),
  // create the user_stats row with the display_name
  if (data.user && data.session && display_name) {
    await supabase
      .from("user_stats")
      .upsert({ user_id: data.user.id, display_name }, { onConflict: "user_id" });
  }

  return NextResponse.json({ user: data.user, session: data.session });
}
