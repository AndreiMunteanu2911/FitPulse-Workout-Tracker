import { describe, expect, it } from "vitest";
import {
  formCoachingResultSchema,
  formRuleThresholdOverrideSchema,
  loginSchema,
  setSchema,
  signupSchema,
  workoutSchema,
} from "./validations";

describe("auth validation schemas", () => {
  it("accepts valid credentials and rejects invalid credentials", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "secret1" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "bad", password: "123" }).success).toBe(false);
  });

  it("requires matching signup passwords", () => {
    expect(signupSchema.safeParse({
      email: "user@example.com",
      password: "secret1",
      confirmPassword: "secret2",
    }).success).toBe(false);
  });
});

describe("workout validation schemas", () => {
  it("bounds workout names and set values", () => {
    expect(workoutSchema.safeParse({ name: "Push day" }).success).toBe(true);
    expect(workoutSchema.safeParse({ name: "" }).success).toBe(false);
    expect(setSchema.safeParse({ reps: 8, weight: 42.5 }).success).toBe(true);
    expect(setSchema.safeParse({ reps: -1, weight: 0 }).success).toBe(false);
  });
});

describe("form validation schemas", () => {
  it("requires at least one threshold override value", () => {
    expect(formRuleThresholdOverrideSchema.safeParse({ ruleId: "depth", min: 65 }).success).toBe(true);
    expect(formRuleThresholdOverrideSchema.safeParse({ ruleId: "depth" }).success).toBe(false);
  });

  it("validates normalized coaching payloads", () => {
    expect(formCoachingResultSchema.safeParse({
      summary: "Keep your torso stable.",
      top_cues: ["Control the lowering phase"],
      rep_observations: ["Rep 2 was rushed"],
      confidence: 0.8,
      needs_human_rule_review: false,
    }).success).toBe(true);
  });
});
