import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, AuthRedirectError, apiFetch } from "@/services/api/apiFetch";

describe("apiFetch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns parsed JSON for successful responses", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    await expect(apiFetch<{ ok: boolean }>("/api/test")).resolves.toEqual({ ok: true });
  });

  it("throws server-provided error messages", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "Nope" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    }));

    await expect(apiFetch("/api/test", { allowAuthRedirect: false })).rejects.toThrow(new AppError("Nope"));
  });

  it("redirects on unauthorized responses by default", async () => {
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      value: { assign },
      configurable: true,
    });
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json" },
    }));

    await expect(apiFetch("/api/private")).rejects.toBeInstanceOf(AuthRedirectError);
    expect(assign).toHaveBeenCalledWith("/login");
  });

  it("converts network failures into a user-facing app error", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("failed"));

    await expect(apiFetch("/api/test")).rejects.toThrow("No internet connection");
  });
});
