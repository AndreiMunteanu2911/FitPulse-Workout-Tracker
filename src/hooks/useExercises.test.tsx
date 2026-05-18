import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useExercises } from "./useExercises";
import { server } from "@/test/mocks/server";

describe("useExercises", () => {
  it("fetches paginated exercises with search params", async () => {
    const requestUrl = vi.fn();
    server.use(
      http.get("/api/exercises", ({ request }) => {
        requestUrl(new URL(request.url));
        return HttpResponse.json({ exercises: [], hasMore: false });
      }),
    );
    const { result } = renderHook(() => useExercises());

    await expect(result.current.fetchExercises(2, "bench")).resolves.toEqual({ exercises: [], hasMore: false });
    expect(requestUrl.mock.calls[0][0].searchParams.get("page")).toBe("2");
    expect(requestUrl.mock.calls[0][0].searchParams.get("search")).toBe("bench");
  });

  it("fetches a single exercise and unwraps the response", async () => {
    server.use(
      http.get("/api/exercises/:id", ({ params }) => (
        HttpResponse.json({ exercise: { exercise_id: params.id, name: "Bench" } })
      )),
    );
    const { result } = renderHook(() => useExercises());

    await expect(result.current.fetchExercise("bench")).resolves.toEqual({ exercise_id: "bench", name: "Bench" });
  });

  it("limits search results client-side", async () => {
    server.use(
      http.get("/api/exercises", () => (
        HttpResponse.json({
          exercises: [
            { exercise_id: "1", name: "One" },
            { exercise_id: "2", name: "Two" },
            { exercise_id: "3", name: "Three" },
          ],
        })
      )),
    );
    const { result } = renderHook(() => useExercises());

    await expect(result.current.searchExercises("press", 2)).resolves.toHaveLength(2);
  });
});
