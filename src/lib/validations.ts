import { z } from "zod";
import { FORM_PATTERNS } from "@/lib/form-rules";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const workoutSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(100, "Name is too long"),
});

export const setSchema = z.object({
  reps: z.number().min(0, "Reps cannot be negative"),
  weight: z.number().min(0, "Weight cannot be negative"),
});

const patternIds = FORM_PATTERNS.map((pattern) => pattern.id) as [string, ...string[]];

export const primaryMetricSchema = z.object({
  kind: z.literal("angle"),
  landmarks: z.tuple([
    z.number().int().min(0).max(32),
    z.number().int().min(0).max(32),
    z.number().int().min(0).max(32),
  ]),
  phaseLogic: z.enum(["flexion_extension", "extension_flexion", "pull_raise_lower", "cyclic"]).optional(),
});

export const formRuleThresholdOverrideSchema = z.object({
  ruleId: z.string().min(1),
  min: z.number().min(0).max(180).optional(),
  max: z.number().min(0).max(180).optional(),
}).refine((value) => value.min !== undefined || value.max !== undefined, {
  message: "At least one threshold value is required",
});

export const formRuleCueOverrideSchema = z.object({
  ruleId: z.string().min(1),
  cue: z.string().min(1).max(80),
});

export const exerciseFormRulesSchema = z.object({
  patternId: z.enum(patternIds),
  applicability: z.enum(["realtime", "post_set_only", "not_applicable"]),
  view: z.enum(["front", "side", "three_quarter"]),
  confidence: z.number().min(0).max(1),
  primaryMetric: primaryMetricSchema,
  overrides: z.object({
    disabledRuleIds: z.array(z.string().min(1)).default([]),
    ruleThresholds: z.array(formRuleThresholdOverrideSchema).default([]),
    cueOverrides: z.array(formRuleCueOverrideSchema).default([]),
  }),
  review: z.object({
    status: z.enum(["ai_generated", "reviewed", "needs_review"]),
    notes: z.string().max(300).optional().default(""),
  }),
});

export type ExerciseFormRulesInput = z.infer<typeof exerciseFormRulesSchema>;

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type SetInput = z.infer<typeof setSchema>;
