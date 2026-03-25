-- =============================================================================
-- Workout Tracker – Complete Supabase Schema
-- Generated from the application API code (source of truth).
--
-- HOW TO USE:
--   Fresh install  → paste this whole file into Supabase SQL Editor and run.
--   Redo / reset   → uncomment the DROP block at the top, run once, then
--                    comment it out again and run the rest.
-- =============================================================================

-- =============================================================================
-- RESET  (uncomment when you need to wipe and rebuild from scratch)
-- =============================================================================
-- DROP TABLE IF EXISTS public.user_achievements  CASCADE;
-- DROP TABLE IF EXISTS public.achievements       CASCADE;
-- DROP TABLE IF EXISTS public.user_stats         CASCADE;
-- DROP TABLE IF EXISTS public.user_exercises     CASCADE;
-- DROP TABLE IF EXISTS public.template_exercises CASCADE;
-- DROP TABLE IF EXISTS public.workout_templates  CASCADE;
-- DROP TABLE IF EXISTS public.progress_photos    CASCADE;
-- DROP TABLE IF EXISTS public.weight_logs        CASCADE;
-- DROP TABLE IF EXISTS public.personal_records   CASCADE;
-- DROP TABLE IF EXISTS public.sets               CASCADE;
-- DROP TABLE IF EXISTS public.workout_exercises  CASCADE;
-- DROP TABLE IF EXISTS public.workouts           CASCADE;
-- DROP TABLE IF EXISTS public.exercises          CASCADE;
-- DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;

-- =============================================================================
-- EXTENSIONS
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. EXERCISES  (shared catalogue – pre-populated, not user-owned)
--    Primary key is exercise_id (TEXT) to match the upstream exercise library.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  exercise_id      TEXT  PRIMARY KEY,
  name             TEXT  NOT NULL,
  gif_url          TEXT,
  target_muscles   TEXT,   -- stored as text; use ilike for filtering
  body_parts       TEXT,
  equipments       TEXT
);

-- No indexes needed – full-text-style filtering via ilike on a shared table.
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
-- Standard exercises (no custom_ prefix) are public read.
-- Custom exercises (custom_<uuid>) are readable only by the user who created them.
CREATE POLICY "exercises_public_read" ON public.exercises
  FOR SELECT USING (
    exercise_id NOT LIKE 'custom_%'
    OR exercise_id IN (
      SELECT 'custom_' || id::text
      FROM   public.custom_exercises
      WHERE  user_id = auth.uid()
    )
  );
-- Allow authenticated users to insert/update their own custom exercise entries.
CREATE POLICY "auth_upsert_custom_exercises" ON public.exercises
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND exercise_id LIKE 'custom_%');
CREATE POLICY "auth_update_custom_exercises" ON public.exercises
  FOR UPDATE USING (auth.uid() IS NOT NULL AND exercise_id LIKE 'custom_%');

-- =============================================================================
-- 2. CUSTOM_EXERCISES  (user-owned exercises)
--    exercise_id format: "custom_<uuid>" to match standard exercise_id pattern
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.custom_exercises (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  body_part   TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_id   ON public.custom_exercises (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_exercises_user_name ON public.custom_exercises (user_id, name);

ALTER TABLE public.custom_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_custom_exercises" ON public.custom_exercises
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 3. WORKOUTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.workouts (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT         NOT NULL DEFAULT 'My Workout',
  workout_date DATE         NOT NULL DEFAULT CURRENT_DATE,
  status       TEXT         NOT NULL DEFAULT 'draft'
                            CHECK (status IN ('draft', 'completed')),
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workouts_user_status ON public.workouts (user_id, status);
CREATE INDEX IF NOT EXISTS idx_workouts_user_date   ON public.workouts (user_id, workout_date DESC);

ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_workouts" ON public.workouts
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 4. WORKOUT_EXERCISES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id  UUID     NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id TEXT     NOT NULL REFERENCES public.exercises(exercise_id),
  order_index INTEGER  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_we_workout_id ON public.workout_exercises (workout_id);

ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_workout_exercises" ON public.workout_exercises
  USING (
    auth.uid() = (SELECT user_id FROM public.workouts WHERE id = workout_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.workouts WHERE id = workout_id)
  );

-- =============================================================================
-- 5. SETS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sets (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID          NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number          INTEGER       NOT NULL DEFAULT 1,
  reps                INTEGER       NOT NULL DEFAULT 0,
  weight              NUMERIC(10,2) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_sets_we_id ON public.sets (workout_exercise_id);

ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_sets" ON public.sets
  USING (
    auth.uid() = (
      SELECT w.user_id
      FROM   public.workouts         w
      JOIN   public.workout_exercises we ON we.workout_id = w.id
      WHERE  we.id = workout_exercise_id
    )
  )
  WITH CHECK (
    auth.uid() = (
      SELECT w.user_id
      FROM   public.workouts         w
      JOIN   public.workout_exercises we ON we.workout_id = w.id
      WHERE  we.id = workout_exercise_id
    )
  );

-- =============================================================================
-- 6. PERSONAL_RECORDS  (one row per user × exercise; updated in-place)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.personal_records (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id  TEXT          NOT NULL REFERENCES public.exercises(exercise_id),
  max_weight   NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_reps     INTEGER       NOT NULL DEFAULT 0,
  workout_date DATE          NOT NULL,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_pr_user_id ON public.personal_records (user_id);

ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_personal_records" ON public.personal_records
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 7. WEIGHT_LOGS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.weight_logs (
  id       UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE          NOT NULL,
  weight   NUMERIC(6,2)  NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date ON public.weight_logs (user_id, log_date ASC);

ALTER TABLE public.weight_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_weight_logs" ON public.weight_logs
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 8. PROGRESS_PHOTOS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.progress_photos (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_url  TEXT         NOT NULL,
  log_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
  notes      TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_user_date ON public.progress_photos (user_id, log_date DESC);

ALTER TABLE public.progress_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_progress_photos" ON public.progress_photos
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 9. WORKOUT_TEMPLATES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.workout_templates (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT         NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.workout_templates (user_id);

ALTER TABLE public.workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_workout_templates" ON public.workout_templates
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 10. TEMPLATE_EXERCISES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.template_exercises (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID     NOT NULL REFERENCES public.workout_templates(id) ON DELETE CASCADE,
  exercise_id TEXT     NOT NULL REFERENCES public.exercises(exercise_id),
  order_index INTEGER  NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_te_template_id ON public.template_exercises (template_id);

ALTER TABLE public.template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_template_exercises" ON public.template_exercises
  USING (
    auth.uid() = (SELECT user_id FROM public.workout_templates WHERE id = template_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.workout_templates WHERE id = template_id)
  );

-- =============================================================================
-- 11. USER_EXERCISES  (per-user exercise favourites / custom settings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_exercises (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id TEXT         NOT NULL REFERENCES public.exercises(exercise_id),
  is_favorite BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, exercise_id)
);

CREATE INDEX IF NOT EXISTS idx_user_exercises_user_id ON public.user_exercises (user_id);

ALTER TABLE public.user_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_user_exercises" ON public.user_exercises
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 12. USER_STATS  (XP bank – source of truth; survives workout deletions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_stats (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp            INTEGER      NOT NULL DEFAULT 0,
  level               INTEGER      NOT NULL DEFAULT 1,
  streak_freeze_count INTEGER      NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_user_stats" ON public.user_stats
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 13. ACHIEVEMENTS  (static catalogue – seeded once, never changes)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id          TEXT     PRIMARY KEY,
  name        TEXT     NOT NULL,
  description TEXT     NOT NULL,
  icon        TEXT     NOT NULL,
  xp_reward   INTEGER  NOT NULL DEFAULT 0,
  category    TEXT     NOT NULL CHECK (category IN ('workouts','streaks','records','volume'))
);

INSERT INTO public.achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_workout',  'First Step',       'Complete your first workout',         '🏋️',    50,  'workouts'),
  ('workouts_5',     'Warm Up',          'Complete 5 workouts',                 '🔥',   100,  'workouts'),
  ('workouts_10',    'Getting Serious',  'Complete 10 workouts',                '💪',   200,  'workouts'),
  ('workouts_25',    'Dedicated',        'Complete 25 workouts',                '🥇',   300,  'workouts'),
  ('workouts_100',   'Century Club',     'Complete 100 workouts',               '💯',  1000,  'workouts'),
  ('streak_3',       'Hat Trick',        'Maintain a 3-day workout streak',     '⚡',    75,  'streaks'),
  ('streak_7',       'On Fire',          'Maintain a 7-day workout streak',     '🔥',   150,  'streaks'),
  ('streak_30',      'Unstoppable',      'Maintain a 30-day workout streak',    '🚀',   500,  'streaks'),
  ('pr_1',           'Record Setter',    'Set your first personal record',      '🏆',    75,  'records'),
  ('pr_5',           'PR Crusher',       'Set 5 personal records',              '🥊',   150,  'records'),
  ('pr_10',          'Record Breaker',   'Set 10 personal records',             '💎',   300,  'records'),
  ('volume_10k',     'Iron Starter',     'Lift 10,000 kg total volume',         '🦾',   100,  'volume'),
  ('volume_50k',     'Heavy Lifter',     'Lift 50,000 kg total volume',         '🏋️‍♂️',  250,  'volume'),
  ('volume_100k',    'Volume King',      'Lift 100,000 kg total volume',        '👑',   500,  'volume')
ON CONFLICT (id) DO NOTHING;

-- Achievement catalogue is public-read (no user-specific data)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_public_read" ON public.achievements
  FOR SELECT USING (true);

-- =============================================================================
-- 14. USER_ACHIEVEMENTS  (unlock log – one row per claimed achievement)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT         NOT NULL REFERENCES public.achievements(id),
  unlocked_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_ua_user_id ON public.user_achievements (user_id);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_user_achievements" ON public.user_achievements
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- STORAGE BUCKET  (progress photos)
-- =============================================================================
-- Create the bucket in Supabase Dashboard → Storage → New bucket
--   Name: progress-photos   Public: OFF
--
-- Then run these policies in the SQL editor:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('progress-photos', 'progress-photos', false)
-- ON CONFLICT DO NOTHING;
--
-- CREATE POLICY "Users upload own photos"
--   ON storage.objects FOR INSERT
--   WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users view own photos"
--   ON storage.objects FOR SELECT
--   USING (auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "Users delete own photos"
--   ON storage.objects FOR DELETE
--   USING (auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- MIGRATIONS  (run these when upgrading an existing database)
-- =============================================================================

-- M1: Allow authenticated users to upsert custom exercises into the exercises table
--     (safe to run multiple times – CREATE POLICY IF NOT EXISTS is not standard, so
--      wrap in a DO block to avoid errors if the policy already exists)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercises'
      AND policyname = 'auth_upsert_custom_exercises'
  ) THEN
    CREATE POLICY "auth_upsert_custom_exercises" ON public.exercises
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND exercise_id LIKE 'custom_%');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'exercises'
      AND policyname = 'auth_update_custom_exercises'
  ) THEN
    CREATE POLICY "auth_update_custom_exercises" ON public.exercises
      FOR UPDATE USING (auth.uid() IS NOT NULL AND exercise_id LIKE 'custom_%');
  END IF;
END $$;

-- M2: Populate exercises table with all known custom exercises
--     (required before re-adding the FK constraint)
INSERT INTO public.exercises (exercise_id, name, body_parts)
SELECT
  'custom_' || ce.id::text,
  ce.name,
  ce.body_part
FROM public.custom_exercises ce
ON CONFLICT (exercise_id) DO NOTHING;

-- M2b: Add placeholder entries for any workout_exercises rows that reference
--      orphaned custom IDs (custom exercise was deleted but workout row remains)
INSERT INTO public.exercises (exercise_id, name)
SELECT DISTINCT we.exercise_id, we.exercise_id
FROM public.workout_exercises we
WHERE we.exercise_id LIKE 'custom_%'
  AND NOT EXISTS (
    SELECT 1 FROM public.exercises e WHERE e.exercise_id = we.exercise_id
  )
ON CONFLICT (exercise_id) DO NOTHING;

-- M3: Re-add the FK constraint (Supabase join syntax requires it)
ALTER TABLE public.workout_exercises
  ADD CONSTRAINT IF NOT EXISTS workout_exercises_exercise_id_fkey
  FOREIGN KEY (exercise_id)
  REFERENCES public.exercises(exercise_id);

-- M4: Add body_part column to custom_exercises (safe on existing tables)
ALTER TABLE public.custom_exercises ADD COLUMN IF NOT EXISTS body_part TEXT;

-- M5: Scope exercises_public_read so custom_% entries are only visible to their owner.
--     Drop the old unrestricted policy and replace it with the scoped one.
DROP POLICY IF EXISTS "exercises_public_read" ON public.exercises;
CREATE POLICY "exercises_public_read" ON public.exercises
  FOR SELECT USING (
    exercise_id NOT LIKE 'custom_%'
    OR exercise_id IN (
      SELECT 'custom_' || id::text
      FROM   public.custom_exercises
      WHERE  user_id = auth.uid()
    )
  );
