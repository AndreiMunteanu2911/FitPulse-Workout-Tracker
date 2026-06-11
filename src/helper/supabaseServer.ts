import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

interface SupabaseServerClientOptions {
  rememberSession?: boolean;
}

const AUTH_PERSISTENCE_COOKIE = "fitpulse-auth-persistence";
const AUTH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function toSessionCookieOptions<T extends Record<string, unknown>>(options?: T): Omit<T, "maxAge" | "expires"> {
  if (!options) return {} as Omit<T, "maxAge" | "expires">;
  const { maxAge: _maxAge, expires: _expires, ...sessionOptions } = options;
  return sessionOptions;
}

function toPersistentCookieOptions<T extends Record<string, unknown>>(options?: T): T & { maxAge: number } {
  return {
    ...((options ?? {}) as T),
    maxAge: AUTH_COOKIE_MAX_AGE,
  };
}

export async function createSupabaseServerClient(options: SupabaseServerClientOptions = {}) {
  const cookieStore = await cookies();
  const storedPreference = cookieStore.get(AUTH_PERSISTENCE_COOKIE)?.value;
  const rememberSession =
    options.rememberSession ??
    (storedPreference === "session" ? false : true);

  if (options.rememberSession !== undefined) {
    cookieStore.set(AUTH_PERSISTENCE_COOKIE, rememberSession ? "persistent" : "session", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      ...(rememberSession ? { maxAge: AUTH_COOKIE_MAX_AGE } : {}),
    });
  }

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
            const isRemoval = cookieOptions?.maxAge === 0;
            cookieStore.set(
              name,
              value,
              isRemoval
                ? cookieOptions
                : rememberSession
                  ? toPersistentCookieOptions(cookieOptions)
                  : toSessionCookieOptions(cookieOptions),
            );
          });
        },
      },
    }
  );
}

export async function clearAuthPersistencePreference() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_PERSISTENCE_COOKIE);
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
