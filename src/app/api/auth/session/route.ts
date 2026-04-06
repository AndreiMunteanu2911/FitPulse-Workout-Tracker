import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ user: null }, { status: 401 });

  // Fetch the user's role from user_stats
  const { data: roleData } = await supabase
    .from("user_stats")
    .select("role")
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: roleData?.role ?? "client",
    },
  });
}
