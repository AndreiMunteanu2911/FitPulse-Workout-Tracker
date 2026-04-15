import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("friendships")
    .select("*, user_stats!friendships_user_id_fkey(display_name), friend_stats:user_stats!friendships_friend_id_fkey(display_name)")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ friendships: data || [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { friend_id } = await req.json();
  if (!friend_id) return NextResponse.json({ error: "friend_id is required" }, { status: 400 });
  if (friend_id === user.id) return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });

  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friend_id}),and(user_id.eq.${friend_id},friend_id.eq.${user.id})`
    )
    .maybeSingle();

  if (existing) return NextResponse.json({ error: "Friendship already exists" }, { status: 409 });

  const { data, error } = await supabase
    .from("friendships")
    .insert({ user_id: user.id, friend_id, status: "pending" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ friendship: data });
}
