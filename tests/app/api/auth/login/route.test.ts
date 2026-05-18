import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/login/route";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

vi.mock("@/helper/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

function request(body: unknown) {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

describe("POST /api/auth/login", () => {
  it("signs in with remember-session cookies enabled when requested", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({
      data: { user: { id: "user-1", email: "user@example.com" } },
      error: null,
    });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { signInWithPassword },
    } as never);

    const response = await POST(request({ email: "user@example.com", password: "secret1", rememberMe: true }));

    await expect(response.json()).resolves.toEqual({ user: { id: "user-1", email: "user@example.com" } });
    expect(response.status).toBe(200);
    expect(createSupabaseServerClient).toHaveBeenCalledWith({ rememberSession: true });
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "user@example.com", password: "secret1" });
  });

  it("returns 401 for invalid credentials", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Invalid login credentials" },
        }),
      },
    } as never);

    const response = await POST(request({ email: "user@example.com", password: "wrong" }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid login credentials" });
  });
});
