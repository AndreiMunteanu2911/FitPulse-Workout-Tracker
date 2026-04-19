export interface User {
  id: string;
  email: string;
  created_at?: string;
  role?: string;
  onboarding_done?: boolean;
  display_name?: string | null;
  birthday?: string | null;
  gender?: "male" | "female" | "other" | null;
  height_cm?: number | null;
}

export interface Exercise {
  exercise_id: string;
  name: string;
  gif_url?: string | null;
  target_muscles?: string[] | null;
  secondary_muscles?: string[] | null;
  body_parts?: string[] | null;
  equipments?: string[] | null;
  instructions?: string[] | null;
  description?: string;
  created_at?: string;
  is_custom?: boolean;
  form_rules?: ExerciseFormRules | null;
}

export type FormRuleApplicability = "realtime" | "post_set_only" | "not_applicable";
export type FormRuleView = "front" | "side" | "three_quarter";
export type FormRulePhase = "eccentric" | "concentric" | "both";
export type FormRuleSeverity = "error" | "warning" | "info";
export type PrimaryMetricKind = "angle";
export type PrimaryMetricPhaseLogic =
  | "flexion_extension"
  | "extension_flexion"
  | "pull_raise_lower"
  | "cyclic";

export interface FormRulePrimaryMetric {
  kind: PrimaryMetricKind;
  landmarks: [number, number, number];
  phaseLogic?: PrimaryMetricPhaseLogic;
}

export interface FormRuleThresholdOverride {
  ruleId: string;
  min?: number;
  max?: number;
}

export interface FormRuleCueOverride {
  ruleId: string;
  cue: string;
}

export interface ExerciseFormRuleOverrideSet {
  disabledRuleIds: string[];
  ruleThresholds: FormRuleThresholdOverride[];
  cueOverrides: FormRuleCueOverride[];
}

export interface ExerciseFormRuleReview {
  status: "ai_generated" | "reviewed" | "needs_review";
  notes?: string;
}

export interface ExerciseFormRules {
  patternId: string;
  applicability: FormRuleApplicability;
  view: FormRuleView;
  confidence: number;
  primaryMetric: FormRulePrimaryMetric;
  overrides: ExerciseFormRuleOverrideSet;
  review: ExerciseFormRuleReview;
}

export interface Set {
  id: string;
  workout_exercise_id?: string;
  set_number: number;
  reps: number;
  weight: number;
  is_confirmed: boolean;
  created_at?: string;
}

export interface WorkoutExercise {
  id: string;
  workout_id?: string;
  exercise_id: string;
  order_index: number;
  exercise: Exercise;
  sets: Set[];
  previousSets?: { reps: number; weight: number }[]; // last session's sets for "Previous" column
  previousSetsLoaded?: boolean; // whether last-session data has been fetched yet
  created_at?: string;
}

export interface Workout {
  id: string;
  user_id?: string;
  name: string;
  workout_date: string;
  status: "draft" | "completed" | "cancelled";
  workout_exercises: WorkoutExercise[];
  created_at?: string;
  updated_at?: string;
  finished_at?: string;
}

export interface WeightLog {
  id: string;
  user_id: string;
  weight: number;
  log_date: string;
  created_at?: string;
}

export interface WorkoutStats {
  totalWorkouts: number;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  totalVolume: number;
  weekVolume: number;
  currentStreak: number;
  longestStreak: number;
  prCount: number;
  weeklyHistogram: { weekLabel: string; count: number }[];
}

export interface APIResponse<T> {
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user?: User;
  error?: string;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  template_exercises?: TemplateExercise[];
  created_at?: string;
  updated_at?: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_id: string;
  order_index: number;
  exercise?: Exercise;
  created_at?: string;
}

export interface UserExercise {
  id: string;
  user_id: string;
  exercise_id: string;
  is_favorite: boolean;
  exercise?: Exercise;
  created_at?: string;
}

export interface ProgressPhoto {
  id: string;
  user_id: string;
  photo_url: string;
  log_date: string;
  notes?: string;
  body_part?: string;
  created_at?: string;
}

export interface PersonalRecord {
  id: string;
  user_id: string;
  exercise_id: string;
  max_weight: number;
  max_reps: number;
  workout_date: string;
  exercise?: Exercise;
  created_at?: string;
  updated_at?: string;
}

// ── Gamification ──────────────────────────────────────────────────────────────

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Lucide icon component name, e.g. "Trophy", "Flame" */
  icon: string;
  xpReward: number;
  category: "workouts" | "streaks" | "records" | "volume";
  /** Non-null when workout conditions are met */
  unlockedAt?: string | null;
  /** Non-null when the user has clicked "Claim" and the XP has been banked */
  claimedAt?: string | null;
}

export interface GamificationStats {
  totalXP: number;
  level: number;
  xpForCurrentLevel: number;
  xpForNextLevel: number;
  xpProgress: number; // 0–100 %
  achievements: Achievement[];
  currentStreak: number;
}

// ── Social ────────────────────────────────────────────────────────────────────

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted";
  created_at?: string;
  updated_at?: string;
  user_stats?: { display_name: string | null };
  friend_stats?: { display_name: string | null };
}

export interface Post {
  id: string;
  user_id: string;
  content?: string | null;
  image_url?: string | null;
  workout_summary?: string | null;
  created_at?: string;
  updated_at?: string;
  user_stats?: { display_name: string | null };
  post_likes?: PostLike[];
  post_comments?: PostComment[];
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at?: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  user_stats?: { display_name: string | null };
}

export interface UserSearchResult {
  user_id: string;
  display_name: string | null;
  friendship_status?: "none" | "pending_sent" | "pending_received" | "accepted";
}

// ── Rest Timer ─────────────────────────────────────────────────────────────────

export type ExerciseType = "compound" | "isolation";

export interface RestTimerState {
  active: boolean;
  duration: number;        // total seconds
  remaining: number;       // seconds left
  exerciseName: string;
  exerciseType: ExerciseType;
  workoutExerciseId?: string; // which exercise card
  setId?: string;            // exact set row to render timer under
}

// ── Blog ───────────────────────────────────────────────────────────────────────

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  author_id: string;
  created_at?: string;
  updated_at?: string;
  likes_count?: number;
  comments_count?: number;
  liked_by_me?: boolean;
}

export interface BlogComment {
  id: string;
  blog_post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    display_name: string;
    avatar_url: string | null;
  };
}
