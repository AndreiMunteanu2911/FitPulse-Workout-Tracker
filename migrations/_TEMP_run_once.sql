-- =============================================================================
-- TEMPORARY: Run ONCE for existing databases, then DELETE this file.
--
-- This file contains ONLY the delta modifications introduced by this update:
--   1. Add `role` column to user_stats
--   2. Add `is_official` column to workout_templates
--   3. Add `uuid` column to achievements
--   4. Admin RLS policies for exercises
--   5. Admin RLS policies for achievements
--   6. Updated RLS for workout_templates (public-read official ones)
--   7. RLS for reading/changing role on user_stats
--
-- These changes ALSO exist in their individual numbered migration files.
-- This file is ONLY for convenience on existing databases.
-- =============================================================================

-- ── 1. Add role column to user_stats ──────────────────────────────────────
ALTER TABLE public.user_stats
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'client'
  CHECK (role IN ('client', 'admin'));

-- ── 2. Add is_official column to workout_templates ────────────────────────
ALTER TABLE public.workout_templates
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN NOT NULL DEFAULT false;

-- ── 3. Add uuid column to achievements ────────────────────────────────────
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS uuid UUID NOT NULL DEFAULT gen_random_uuid();

-- ── 3b. Add missing columns to exercises ──────────────────────────────────
ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS secondary_muscles TEXT[];

ALTER TABLE public.exercises
  ADD COLUMN IF NOT EXISTS instructions TEXT[];

-- ── 3c. Add is_confirmed column to sets ───────────────────────────────────
ALTER TABLE public.sets
  ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN NOT NULL DEFAULT false;

-- ── 4. Admin RLS policies for exercises ───────────────────────────────────
DROP POLICY IF EXISTS "admins_manage_exercises" ON public.exercises;
CREATE POLICY "admins_manage_exercises" ON public.exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_stats
      WHERE user_stats.user_id = auth.uid()
        AND user_stats.role = 'admin'
    )
  );

-- ── 5. Admin RLS policies for achievements ────────────────────────────────
DROP POLICY IF EXISTS "admins_manage_achievements" ON public.achievements;
CREATE POLICY "admins_manage_achievements" ON public.achievements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_stats
      WHERE user_stats.user_id = auth.uid()
        AND user_stats.role = 'admin'
    )
  );

-- ── 6. Updated RLS for workout_templates (public-read official ones) ──────
DROP POLICY IF EXISTS "own_workout_templates" ON public.workout_templates;
CREATE POLICY "own_workout_templates" ON public.workout_templates
  USING (auth.uid() = user_id OR is_official = true)
  WITH CHECK (auth.uid() = user_id);

-- ── 7. RLS for reading/changing role on user_stats ────────────────────────
DROP POLICY IF EXISTS "read_user_roles" ON public.user_stats;
CREATE POLICY "read_user_roles" ON public.user_stats
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "admins_manage_roles" ON public.user_stats;
CREATE POLICY "admins_manage_roles" ON public.user_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_stats ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'
    )
  );
