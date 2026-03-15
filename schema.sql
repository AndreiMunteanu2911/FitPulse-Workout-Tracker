-- =============================================================================
-- Workout Tracker – Full Database Schema
-- Run this in your Supabase SQL editor (Dashboard → SQL editor → New query)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. EXERCISES  (reference library – shared across all users)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists exercises (
  exercise_id   text        primary key,   -- matches the external API id (text)
  name          text        not null,
  gif_url       text,
  target_muscles  text[],
  secondary_muscles text[],
  body_parts    text[],
  equipments    text[],
  instructions  text[],
  description   text,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. WORKOUTS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists workouts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  name          text        not null default 'My Workout',
  workout_date  date        not null default current_date,
  status        text        not null default 'draft'
                            check (status in ('draft', 'completed', 'cancelled')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  finished_at   timestamptz
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_workouts_updated_at on workouts;
create trigger trg_workouts_updated_at
  before update on workouts
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. WORKOUT_EXERCISES  (exercises within a workout session)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists workout_exercises (
  id            uuid        primary key default gen_random_uuid(),
  workout_id    uuid        not null references workouts(id) on delete cascade,
  exercise_id   text        not null references exercises(exercise_id) on delete restrict,
  order_index   integer     not null default 0,
  created_at    timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. SETS  (individual sets within a workout exercise)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists sets (
  id                  uuid    primary key default gen_random_uuid(),
  workout_exercise_id uuid    not null references workout_exercises(id) on delete cascade,
  set_number          integer not null default 1,
  reps                integer not null default 0,
  weight              numeric(8,2) not null default 0,
  created_at          timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. PERSONAL_RECORDS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists personal_records (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  exercise_id   text        not null references exercises(exercise_id) on delete cascade,
  max_weight    numeric(8,2) not null default 0,
  max_reps      integer     not null default 0,
  workout_date  date        not null default current_date,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique (user_id, exercise_id)
);

drop trigger if exists trg_pr_updated_at on personal_records;
create trigger trg_pr_updated_at
  before update on personal_records
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. WEIGHT_LOGS  (body weight tracking)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists weight_logs (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  weight      numeric(6,2) not null,
  log_date    date        not null default current_date,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. PROGRESS_PHOTOS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists progress_photos (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  photo_url   text        not null,
  log_date    date        not null default current_date,
  notes       text,
  body_part   text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. USER_EXERCISES  (user favourites / saved exercises)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists user_exercises (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null references auth.users(id) on delete cascade,
  exercise_id   text    not null references exercises(exercise_id) on delete cascade,
  is_favorite   boolean not null default false,
  created_at    timestamptz default now(),
  unique (user_id, exercise_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. WORKOUT_TEMPLATES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists workout_templates (
  id            uuid    primary key default gen_random_uuid(),
  user_id       uuid    not null references auth.users(id) on delete cascade,
  name          text    not null,
  description   text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

drop trigger if exists trg_templates_updated_at on workout_templates;
create trigger trg_templates_updated_at
  before update on workout_templates
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. TEMPLATE_EXERCISES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists template_exercises (
  id            uuid    primary key default gen_random_uuid(),
  template_id   uuid    not null references workout_templates(id) on delete cascade,
  exercise_id   text    not null references exercises(exercise_id) on delete cascade,
  order_index   integer not null default 0,
  created_at    timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────
-- 11. User stats (XP, level, streak freeze tokens)
-- ────────────────────────────────────────────────────────────────
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

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: users can only see/edit their own row
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_user_stats" ON public.user_stats
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────
-- 12. Achievement catalogue (static reference data)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.achievements (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL,
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  category    TEXT NOT NULL CHECK (category IN ('workouts','streaks','records','volume'))
);

-- Seed the catalogue
INSERT INTO public.achievements (id, name, description, icon, xp_reward, category) VALUES
  ('first_workout',  'First Step',       'Complete your first workout',         'Dumbbell',            50,   'workouts'),
  ('workouts_5',     'Warm Up',          'Complete 5 workouts',                 'Activity',           100,   'workouts'),
  ('workouts_10',    'Getting Serious',  'Complete 10 workouts',                'TrendingUp',         200,   'workouts'),
  ('workouts_25',    'Dedicated',        'Complete 25 workouts',                'Star',               300,   'workouts'),
  ('workouts_100',   'Century Club',     'Complete 100 workouts',               'Award',             1000,   'workouts'),
  ('streak_3',       'Hat Trick',        'Maintain a 3-day workout streak',     'Zap',                 75,   'streaks'),
  ('streak_7',       'On Fire',          'Maintain a 7-day workout streak',     'Flame',              150,   'streaks'),
  ('streak_30',      'Unstoppable',      'Maintain a 30-day workout streak',    'Rocket',             500,   'streaks'),
  ('pr_1',           'Record Setter',    'Set your first personal record',      'Trophy',              75,   'records'),
  ('pr_5',           'PR Crusher',       'Set 5 personal records',              'Target',             150,   'records'),
  ('pr_10',          'Record Breaker',   'Set 10 personal records',             'Medal',              300,   'records'),
  ('volume_10k',     'Iron Starter',     'Lift 10,000 kg total volume',         'BarChart2',          100,   'volume'),
  ('volume_50k',     'Heavy Lifter',     'Lift 50,000 kg total volume',         'ChartBarIncreasing', 250,   'volume'),
  ('volume_100k',    'Volume King',      'Lift 100,000 kg total volume',        'Crown',              500,   'volume')
ON CONFLICT (id) DO NOTHING;

-- ────────────────────────────────────────────────────────────────
-- 13. User achievements (unlock log)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT         NOT NULL REFERENCES public.achievements(id),
  unlocked_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_user_achievements" ON public.user_achievements
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) – workout-related tables
-- =============================================================================

ALTER TABLE workouts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_photos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exercises     ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates  ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
-- exercises table is public-read, no user-specific RLS needed

-- ── workouts ─────────────────────────────────────────────────────────────────
create policy "Users manage own workouts"
  on workouts for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── workout_exercises ─────────────────────────────────────────────────────────
create policy "Users manage own workout_exercises"
  on workout_exercises for all
  using  (auth.uid() = (select user_id from workouts where id = workout_id))
  with check (auth.uid() = (select user_id from workouts where id = workout_id));

-- ── sets ─────────────────────────────────────────────────────────────────────
create policy "Users manage own sets"
  on sets for all
  using (
    auth.uid() = (
      select w.user_id from workouts w
      join workout_exercises we on we.workout_id = w.id
      where we.id = workout_exercise_id
    )
  )
  with check (
    auth.uid() = (
      select w.user_id from workouts w
      join workout_exercises we on we.workout_id = w.id
      where we.id = workout_exercise_id
    )
  );

-- ── personal_records ─────────────────────────────────────────────────────────
create policy "Users manage own personal_records"
  on personal_records for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── weight_logs ───────────────────────────────────────────────────────────────
create policy "Users manage own weight_logs"
  on weight_logs for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── progress_photos ───────────────────────────────────────────────────────────
create policy "Users manage own progress_photos"
  on progress_photos for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── user_exercises ────────────────────────────────────────────────────────────
create policy "Users manage own user_exercises"
  on user_exercises for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── workout_templates ─────────────────────────────────────────────────────────
create policy "Users manage own workout_templates"
  on workout_templates for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── template_exercises ────────────────────────────────────────────────────────
create policy "Users manage own template_exercises"
  on template_exercises for all
  using (
    auth.uid() = (select user_id from workout_templates where id = template_id)
  )
  with check (
    auth.uid() = (select user_id from workout_templates where id = template_id)
  );

-- ── exercises (public read) ───────────────────────────────────────────────────
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are publicly readable"
  ON exercises FOR SELECT
  USING (true);

-- achievements catalogue is publicly readable (no user-specific data)
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Achievements are publicly readable"
  ON public.achievements FOR SELECT
  USING (true);

-- =============================================================================
-- STORAGE BUCKET (progress photos)
-- =============================================================================
-- Run in Supabase Dashboard → Storage → New bucket, OR via SQL:
--
-- insert into storage.buckets (id, name, public)
-- values ('progress-photos', 'progress-photos', false)
-- on conflict do nothing;
--
-- create policy "Users can upload their own photos"
--   on storage.objects for insert
--   with check (auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Users can view their own photos"
--   on storage.objects for select
--   using (auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Users can delete their own photos"
--   on storage.objects for delete
--   using (auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- MIGRATION  (run only if upgrading an existing DB – skip for fresh installs)
-- =============================================================================

-- Drop old gamification tables/functions if they exist, then recreate cleanly.
-- Run each line separately in the Supabase SQL editor.
--
-- DROP TABLE IF EXISTS public.user_achievements CASCADE;
-- DROP TABLE IF EXISTS public.user_stats        CASCADE;
-- DROP TABLE IF EXISTS public.achievements      CASCADE;
-- DROP FUNCTION IF EXISTS public.increment_achievement_xp(uuid, integer);
--
-- Then re-run this entire file from the top (CREATE TABLE IF NOT EXISTS is safe to re-run).
