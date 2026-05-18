import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/auth/logout/route";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

vi.mock("@/helper/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe("POST /api/auth/logout", () => {
  it("signs out through Supabase and returns success", async () => {
    const signOut = vi.fn().mockResolvedValue({});
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { signOut },
    } as never);

    const response = await POST();

    expect(response.status).toBe(200);
    expect(signOut).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toEqual({ success: true });
  });
});
