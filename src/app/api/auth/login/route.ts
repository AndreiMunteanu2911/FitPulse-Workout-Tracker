import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { loginSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 400 });
  }

  const rememberMe = body && typeof body === "object" && "rememberMe" in body && body.rememberMe === true;
  const supabase = await createSupabaseServerClient({ rememberSession: rememberMe === true });
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  return NextResponse.json({ user: data.user });
}
