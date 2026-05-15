import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface SupabaseServerClientOptions {
  rememberSession?: boolean;
}

function toSessionCookieOptions<T extends Record<string, unknown>>(options?: T): Omit<T, "maxAge" | "expires"> {
  if (!options) return {} as Omit<T, "maxAge" | "expires">;
  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions;
}

export async function createSupabaseServerClient(options: SupabaseServerClientOptions = {}) {
  const cookieStore = await cookies();
  const rememberSession = options.rememberSession ?? true;

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options: cookieOptions }) => {
            cookieStore.set(
              name,
              value,
              rememberSession ? cookieOptions : toSessionCookieOptions(cookieOptions),
            );
          });
        },
      },
    }
  );
}

export interface AdminContext {
  supabase: SupabaseClient;
  user: User;
}

/**
 * Checks that the current user is authenticated AND has the admin role.
 * Returns { supabase, user } on success, or a NextResponse error on failure.
 *
 * Usage:
 *   const guard = await requireAdmin();
 *   if ("error" in guard) return guard.error;
 *   const { supabase, user } = guard;
 */
export async function requireAdmin(): Promise<
  | AdminContext
  | { error: NextResponse<{ error: string }> }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: roleData } = await supabase
    .from("user_stats")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleData?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { supabase, user };
}
