import { z } from "zod";

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

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type WorkoutInput = z.infer<typeof workoutSchema>;
export type SetInput = z.infer<typeof setSchema>;
