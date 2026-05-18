import { describe, expect, it, vi } from "vitest";
import { DELETE, PATCH } from "@/app/api/sets/[id]/route";
import { createSupabaseServerClient } from "@/helper/supabaseServer";

vi.mock("@/helper/supabaseServer", () => ({
  createSupabaseServerClient: vi.fn(),
}));

function request(body: unknown = {}) {
  return new Request("http://localhost/api/sets/set-1", {
    method: "PATCH",
    body: JSON.stringify(body),
  }) as never;
}

function query(result: unknown) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: vi.fn((resolve, reject) => Promise.resolve(result).then(resolve, reject)),
  };
  return builder;
}

function params(id = "set-1") {
  return { params: Promise.resolve({ id }) };
}

function ownedSupabase(finalResult: unknown = { error: null }) {
  const setLookup = query({ data: { workout_exercise_id: "we-1" } });
  const workoutExerciseLookup = query({ data: { workout_id: "workout-1" } });
  const workoutLookup = query({ data: { id: "workout-1" } });
  const mutation = query(finalResult);
  const from = vi.fn((table: string) => {
    if (table === "sets" && from.mock.calls.filter(([name]) => name === "sets").length === 1) return setLookup;
    if (table === "workout_exercises") return workoutExerciseLookup;
    if (table === "workouts") return workoutLookup;
    return mutation;
  });

  return {
    supabase: {
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from,
    },
    setLookup,
    workoutLookup,
    mutation,
  };
}

describe("PATCH /api/sets/:id", () => {
  it("rejects unauthenticated requests", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    } as never);

    const response = await PATCH(request({ reps: 8 }), params());

    expect(response.status).toBe(401);
  });

  it("verifies ownership before updating allowed fields", async () => {
    const { supabase, workoutLookup, mutation } = ownedSupabase();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const response = await PATCH(request({ reps: 10, weight: 90, ignored: "value" }), params());

    expect(response.status).toBe(200);
    expect(workoutLookup.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(mutation.update).toHaveBeenCalledWith({ reps: 10, weight: 90 });
    expect(mutation.eq).toHaveBeenCalledWith("id", "set-1");
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns 404 when the set is not owned by the user", async () => {
    const setLookup = query({ data: null });
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }) },
      from: vi.fn(() => setLookup),
    } as never);

    const response = await PATCH(request({ reps: 10 }), params());

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/sets/:id", () => {
  it("verifies ownership before deleting a set", async () => {
    const { supabase, mutation } = ownedSupabase();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const response = await DELETE(new Request("http://localhost/api/sets/set-1") as never, params());

    expect(response.status).toBe(200);
    expect(mutation.delete).toHaveBeenCalledOnce();
    expect(mutation.eq).toHaveBeenCalledWith("id", "set-1");
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it("returns mutation errors", async () => {
    const { supabase } = ownedSupabase({ error: { message: "Delete failed" } });
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);

    const response = await DELETE(new Request("http://localhost/api/sets/set-1") as never, params());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ error: "Delete failed" });
  });
});
