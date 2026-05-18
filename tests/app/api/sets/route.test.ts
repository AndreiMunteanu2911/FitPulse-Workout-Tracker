import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/sets/route";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

vi.mock("@/helper/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

function request(body: unknown) {
  return new Request("http://localhost/api/sets", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

function builder(result: unknown) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    insert: vi.fn(() => query),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    single: vi.fn(() => Promise.resolve(result)),
  };
  return query;
}

describe("POST /api/sets", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const response = await POST(request({}));

    expect(response.status).toBe(401);
  });

  it("verifies workout ownership before inserting a set", async () => {
    const workoutExercise = builder({ data: { workout_id: "workout-1" } });
    const workout = builder({ data: { id: "workout-1" } });
    const insertedSet = builder({ data: { id: "set-1", reps: 8, weight: 100 }, error: null });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn((table: string) => {
        if (table === "workout_exercises") return workoutExercise;
        if (table === "workouts") return workout;
        return insertedSet;
      }),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const response = await POST(request({
      workout_exercise_id: "we-1",
      set_number: 2,
      reps: 8,
      weight: 100,
      is_confirmed: true,
    }));

    expect(response.status).toBe(200);
    expect(workout.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(insertedSet.insert).toHaveBeenCalledWith({
      workout_exercise_id: "we-1",
      set_number: 2,
      reps: 8,
      weight: 100,
      is_confirmed: true,
    });
    await expect(response.json()).resolves.toEqual({ set: { id: "set-1", reps: 8, weight: 100 } });
  });

  it("returns 404 when ownership cannot be verified", async () => {
    const workoutExercise = builder({ data: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => workoutExercise),
    } as never);

    const response = await POST(request({ workout_exercise_id: "missing" }));

    expect(response.status).toBe(404);
  });
});
