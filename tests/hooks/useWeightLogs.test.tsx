import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useWeightLogs } from "@/hooks/useWeightLogs";
import { server } from "#tests/mocks/server";

describe("useWeightLogs", () => {
  it("fetches weight logs and unwraps the response", async () => {
    const weights = [{ id: "w1", user_id: "u1", weight: 80, log_date: "2026-05-18" }];
    server.use(
      http.get("/api/weight-logs", () => HttpResponse.json({ weights })),
    );
    const { result } = renderHook(() => useWeightLogs());

    await expect(result.current.fetchWeights()).resolves.toEqual(weights);
  });

  it("posts new weight logs", async () => {
    const bodySpy = vi.fn();
    server.use(
      http.post("/api/weight-logs", async ({ request }) => {
        bodySpy(await request.json());
        return HttpResponse.json({});
      }),
    );
    const { result } = renderHook(() => useWeightLogs());

    await result.current.addWeight("2026-05-18", "81.5");

    expect(bodySpy).toHaveBeenCalledWith({ log_date: "2026-05-18", weight: "81.5" });
  });

  it("deletes weight logs by id", async () => {
    const requestUrl = vi.fn();
    server.use(
      http.delete("/api/weight-logs", ({ request }) => {
        requestUrl(new URL(request.url));
        return HttpResponse.json({});
      }),
    );
    const { result } = renderHook(() => useWeightLogs());

    await result.current.deleteWeight("w1");

    expect(requestUrl.mock.calls[0][0].searchParams.get("id")).toBe("w1");
  });
});
