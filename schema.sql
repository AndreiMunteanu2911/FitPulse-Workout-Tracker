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

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. USER_ACHIEVEMENTS  (DB is the source of truth for achievement state)
--   status = 'unlocked'  → conditions met, reward not yet collected
--   status = 'claimed'   → user clicked Claim; XP has been banked
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists user_achievements (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users(id) on delete cascade,
  achievement_id text        not null,
  status         text        not null default 'unlocked'
                             check (status in ('unlocked', 'claimed')),
  unlocked_at    timestamptz not null default now(),
  claimed_at     timestamptz,                       -- null until user claims
  unique (user_id, achievement_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. USER_STATS  (persistent XP bank – survives achievement row deletions)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists user_stats (
  user_id        uuid    primary key references auth.users(id) on delete cascade,
  achievement_xp integer not null default 0
);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

alter table workouts           enable row level security;
alter table workout_exercises  enable row level security;
alter table sets               enable row level security;
alter table personal_records   enable row level security;
alter table weight_logs        enable row level security;
alter table progress_photos    enable row level security;
alter table user_exercises     enable row level security;
alter table workout_templates  enable row level security;
alter table template_exercises enable row level security;
alter table user_achievements  enable row level security;
alter table user_stats         enable row level security;
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
alter table exercises enable row level security;
create policy "Exercises are publicly readable"
  on exercises for select
  using (true);

-- ── user_achievements ─────────────────────────────────────────────────────────
create policy "Users manage own user_achievements"
  on user_achievements for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── user_stats ────────────────────────────────────────────────────────────────
create policy "Users manage own user_stats"
  on user_stats for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── Helper function: atomically increment achievement_xp ──────────────────────
create or replace function increment_achievement_xp(p_user_id uuid, p_amount integer)
returns void language plpgsql security definer as $$
begin
  insert into user_stats (user_id, achievement_xp)
  values (p_user_id, p_amount)
  on conflict (user_id)
  do update set achievement_xp = user_stats.achievement_xp + p_amount;
end;
$$;

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
-- MIGRATION  (run this if you already have the old schema in your DB)
-- =============================================================================
-- If you are starting fresh, the CREATE TABLE statements above are sufficient.
-- If you are upgrading an existing database, run the following instead:

-- Step 1 – add new columns to user_achievements
--   NOTE: default 'claimed' is only used to back-fill existing rows (they were
--   all claimed under the old schema). The main schema default is 'unlocked'.
-- alter table user_achievements
--   add column if not exists status text not null default 'claimed'
--     constraint user_achievements_status_check check (status in ('unlocked', 'claimed')),
--   add column if not exists unlocked_at timestamptz;

-- Step 2 – back-fill unlocked_at from claimed_at for existing rows
-- update user_achievements
--   set unlocked_at = claimed_at
--   where unlocked_at is null;

-- Step 3 – make unlocked_at NOT NULL now that it is populated
-- alter table user_achievements
--   alter column unlocked_at set not null;

-- Step 4 – make claimed_at nullable (was NOT NULL in old schema)
-- alter table user_achievements
--   alter column claimed_at drop not null;

-- Step 5 – create user_stats and its RLS policy
-- create table if not exists user_stats (
--   user_id        uuid    primary key references auth.users(id) on delete cascade,
--   achievement_xp integer not null default 0
-- );
-- alter table user_stats enable row level security;
-- create policy "Users manage own user_stats"
--   on user_stats for all
--   using  (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

-- Step 6 – back-fill user_stats.achievement_xp from already-claimed achievements
-- (This seeds the persistent XP bank so existing users keep their earned XP)
-- insert into user_stats (user_id, achievement_xp)
-- select
--   ua.user_id,
--   sum(ad.xp_reward)
-- from user_achievements ua
-- join (
--   values
--     ('first_workout', 50), ('workouts_5', 100), ('workouts_10', 200),
--     ('workouts_25', 300), ('workouts_100', 1000),
--     ('streak_3', 75),  ('streak_7', 150),  ('streak_30', 500),
--     ('pr_1', 75),  ('pr_5', 150),  ('pr_10', 300),
--     ('volume_10k', 100), ('volume_50k', 250), ('volume_100k', 500)
-- ) as ad(id, xp_reward) on ua.achievement_id = ad.id
-- where ua.status = 'claimed'
-- group by ua.user_id
-- on conflict (user_id) do update
--   set achievement_xp = user_stats.achievement_xp + excluded.achievement_xp;
