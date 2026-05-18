import { describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/auth/session/route";
import { loadSessionUser } from "@/lib/auth-session";

vi.mock("@/lib/auth-session", () => ({
  loadSessionUser: vi.fn(),
}));

describe("GET /api/auth/session", () => {
  it("returns 401 when no session user is present", async () => {
    vi.mocked(loadSessionUser).mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ user: null });
  });

  it("returns the session user", async () => {
    const user = { id: "user-1", email: "user@example.com", onboarding_done: true };
    vi.mocked(loadSessionUser).mockResolvedValue(user as never);

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ user });
  });
});
