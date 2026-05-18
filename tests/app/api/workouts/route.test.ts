import { describe, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/workouts/route";
import { createSupabaseServerClient } from "@/helper/supabaseServer";
import { resolveExercises } from "@/helper/resolveExercises";

vi.mock("@/helper/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/helper/resolveExercises", () => ({
  resolveExercises: vi.fn(),
}));

function request(body: unknown) {
  return new Request("http://localhost/api/workouts", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

function chain(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    then: vi.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject)),
  };
  return builder;
}

describe("GET /api/workouts", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns completed workouts with resolved exercises and sorted nested data", async () => {
    const workoutsBuilder = chain({
      data: [
        {
          id: "workout-1",
          workout_exercises: [
            { exercise_id: "row", order_index: 2, sets: [{ set_number: 2 }, { set_number: 1 }] },
            { exercise_id: "bench", order_index: 1, sets: [] },
          ],
        },
      ],
      error: null,
    });
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => workoutsBuilder),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    vi.mocked(resolveExercises).mockResolvedValue(new Map([
      ["bench", { exercise_id: "bench", name: "Bench Press", is_custom: false }],
      ["row", { exercise_id: "row", name: "Row", is_custom: false }],
    ]) as never);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(supabase.from).toHaveBeenCalledWith("workouts");
    expect(workoutsBuilder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(workoutsBuilder.eq).toHaveBeenCalledWith("status", "completed");
    expect(resolveExercises).toHaveBeenCalledWith(supabase, ["row", "bench"]);
    expect(json.workouts[0].workout_exercises.map((item: { exercise_id: string }) => item.exercise_id)).toEqual(["bench", "row"]);
    expect(json.workouts[0].workout_exercises[1].sets).toEqual([{ set_number: 1 }, { set_number: 2 }]);
  });
});

describe("POST /api/workouts", () => {
  it("creates a draft workout for the authenticated user", async () => {
    const insertResult = { data: { id: "workout-1", name: "Leg day" }, error: null };
    const workoutsBuilder = chain(insertResult);
    const supabase = {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => workoutsBuilder),
    };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const response = await POST(request({ name: "Leg day" }));

    expect(response.status).toBe(200);
    expect(workoutsBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-1",
      name: "Leg day",
      status: "draft",
    }));
    await expect(response.json()).resolves.toEqual({ workout: { id: "workout-1", name: "Leg day" } });
  });

  it("defaults the workout name when none is provided", async () => {
    const workoutsBuilder = chain({ data: { id: "workout-1" }, error: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => workoutsBuilder),
    } as never);

    await POST(request({}));

    expect(workoutsBuilder.insert).toHaveBeenCalledWith(expect.objectContaining({ name: "My Workout" }));
  });
});
