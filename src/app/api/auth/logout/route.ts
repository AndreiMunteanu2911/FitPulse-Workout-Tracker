import { NextResponse } from "next/server";
import {
  clearAuthPersistencePreference,
  createSupabaseServerClient,
} from "@/helper/supabaseServer";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearAuthPersistencePreference();
  return NextResponse.json({ success: true });
}
