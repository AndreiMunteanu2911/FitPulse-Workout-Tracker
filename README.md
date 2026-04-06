# FitPulse — Workout Tracker

[Visit Live Vercel Deployment](https://fitpulseam.vercel.app)

FitPulse is a full-stack mobile-first fitness tracking web app built with **Next.js 15 App Router**, **React**, **Supabase**, **Tailwind CSS**, and **Lucide React**. It helps athletes and fitness enthusiasts log every rep, monitor progress over time, and build consistent habits—all from a slick, responsive interface that works great on both mobile and desktop.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Pages](#pages)
- [Components](#components)
- [Hooks](#hooks)
- [Authentication & Data](#authentication--data)
- [Admin System](#admin-system)
- [UI & Styling](#ui--styling)
- [Setup & Usage](#setup--usage)
- [Dark Mode](#dark-mode)
- [Database Structure (Supabase)](#database-structure-supabase)
- [Database Schema Diagram](#database-schema-diagram)
- [Credits](#credits)

---

## Features

- **User Authentication** — Sign up, log in, and protected routes via Supabase Auth with cookie-based session management.
- **Dashboard** — At-a-glance overview of total workouts, weekly/monthly stats, current streak, personal record count, and total volume lifted, plus a weekly workout histogram.
- **Workout Builder** — Start a workout, add exercises from the full library, log sets with reps and weight, confirm individual sets, and finish or cancel at any time.
- **Workout History** — Paginated list of all past workouts with per-workout stats (volume, duration, PR badges). Full detail view lets you edit sets, rename, or delete a past workout.
- **Exercise Library** — Infinite-scroll searchable list of all exercises with muscle-group and equipment metadata. Individual exercise pages show a GIF demonstration, personal records, and a historical performance chart.
- **Personal Records** — Automatically tracks best weight and rep count for every exercise.
- **Weight Tracking** — Log your bodyweight over time. Visualise progress with a responsive interactive line chart (Recharts). Delete individual entries.
- **Progress Photos** — Upload photos with a body-part tag and optional notes; delete any photo. Photos are stored in a Supabase Storage bucket.
- **Workout Templates** — Save and manage reusable workout templates. Start a new workout directly from a template.
- **User Exercise Library & Favourites** — Mark exercises as favourites for quick access.
- **AI Coach** — RAG-powered fitness assistant with access to your workout history, PRs, and muscle recovery data. Can answer personalized questions and create draft workouts you can start immediately. Powered by OpenRouter's free-tier LLMs.
- **Admin Dashboard** — Role-based admin panel for managing the exercise catalogue, user accounts and roles, official workout templates, and platform-wide analytics.
- **Dark Mode** — Fully themed light/dark mode with instant toggle (no flash), persisted to localStorage via Zustand.
- **Responsive Layout** — Desktop sidebar + main content area; mobile fixed top bar + bottom tab navigation.
- **Icons** — Every icon in the app is sourced from **Lucide React** for consistent, crisp vector icons at every size.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI Library | React 19 |
| Styling | Tailwind CSS v4 + custom CSS variables |
| Icons | Lucide React |
| Charts | Recharts |
| Animation | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth + `@supabase/ssr` |
| Storage | Supabase Storage |
| State | Zustand (theme), React hooks (data) |
| Validation | Zod |
| Language | TypeScript |
| Package Manager | npm / pnpm |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Browser / Client                  │
│                                                      │
│  React components call custom hooks                  │
│  Custom hooks → fetch() → Next.js API routes         │
└─────────────────────────┬───────────────────────────┘
                          │ HTTP (same origin)
┌─────────────────────────▼───────────────────────────┐
│            Next.js API Routes  (server-only)         │
│                                                      │
│  src/app/api/**                                      │
│  • Reads SUPABASE_URL + SUPABASE_ANON_KEY (env)     │
│  • Validates session via @supabase/ssr cookie        │
│  • Executes Supabase queries                         │
│  • Returns JSON to the client                        │
│  • Admin routes require user_stats.role = 'admin'    │
└─────────────────────────┬───────────────────────────┘
                          │ Supabase JS SDK
┌─────────────────────────▼───────────────────────────┐
│                      Supabase                        │
│                                                      │
│  • PostgreSQL database (all user data)               │
│  • Supabase Auth (session management)                │
│  • Supabase Storage (progress photos)                │
│  • Row-level security on all tables                  │
└─────────────────────────────────────────────────────┘
```

### Key architectural decisions

- **No direct Supabase access from client code.** All database reads and writes go through Next.js API routes, keeping credentials server-only.
- **Cookie-based sessions via `@supabase/ssr`.** The server verifies the user's identity on every API request without exposing tokens to JavaScript.
- **Role-based admin access.** Admin privileges are controlled via a `role` column on `user_stats`. Both RLS policies and code-level guards (`requireAdmin()`) enforce admin-only routes.
- **Route groups.** `(auth)` contains public pages (landing, login, sign-up). `(main)` contains all protected pages wrapped in a shared layout with Navbar and TopBar.
- **Component-based UI.** All reusable pieces live in `src/components/`. Pages are thin—they compose components and call hooks.

---

## Pages

### Auth Group `(auth)/`

| Route | File | Description |
|---|---|---|
| `/` | `page.tsx` | Landing page with hero copy and sign-up / log-in CTAs |
| `/login` | `login/page.tsx` | Email + password login form with Zod validation |
| `/signup` | `signup/page.tsx` | Registration form; sends email verification link via Supabase |

### Main Group `(main)/`

All pages in this group are protected by `ProtectedWrapper`.

| Route | File | Description |
|---|---|---|
| `/dashboard` | `dashboard/page.tsx` | Stats overview, weekly histogram, admin card (if admin) |
| `/workout` | `workout/page.tsx` | Active workout builder — add exercises, log sets, finish/cancel |
| `/exercises` | `exercises/page.tsx` | Searchable exercise library |
| `/exercises/[id]` | `exercises/[id]/page.tsx` | Exercise detail: GIF, muscles, PRs, stats chart |
| `/history` | `history/page.tsx` | Paginated list of completed workouts with quick edit/delete |
| `/history/[id]` | `history/[id]/page.tsx` | Full workout detail with inline set editing |
| `/profile` | `profile/page.tsx` | User info, workout calendar, weight log + chart, progress photos |
| `/ai-coach` | `ai-coach/page.tsx` | AI-powered fitness coach with conversation history and draft workout creation |
| `/admin` | `admin/page.tsx` | Admin hub — quick stats and navigation to sub-pages |
| `/admin/exercises` | `admin/exercises/page.tsx` | Admin CRUD for the standard exercise catalogue |
| `/admin/users` | `admin/users/page.tsx` | User list with role management (client ↔ admin) |
| `/admin/templates` | `admin/templates/page.tsx` | Create and delete official workout templates |
| `/admin/analytics` | `admin/analytics/page.tsx` | Platform-wide metrics: users, workouts, volume, charts |

---

## Components

### Layout & Navigation

| Component | Description |
|---|---|
| `Navbar` | Desktop sidebar + mobile bottom tab bar. Uses Lucide icons for each tab. |
| `TopBar` | Fixed mobile-only top bar showing the current page title and a Dumbbell logo on the right. |
| `ProtectedWrapper` | Client HOC that checks `/api/auth/session`. Redirects unauthenticated users to `/login`. |
| `ThemeProvider` | Applies `dark` class to `<html>` on mount based on persisted theme. |
| `DarkModeToggle` | Sun/Moon toggle button (Lucide icons) that switches and persists the theme. |
| `ScrollbarContainer` | Thin wrapper that applies custom scrollbar styles. |
| `ErrorBoundary` | React error boundary for graceful degradation. |
| `LoadingSpinner` | Animated CSS spinner for async states. |

### Core UI

| Component | Description |
|---|---|
| `Button` | Polymorphic button with `primary`, `secondary`, `textOnly`, and `danger` variants. |
| `StatCard` | Dashboard stat tile: title, value, subtitle, optional trend indicator and icon. |
| `ModalWrapper` | Animated modal backdrop + card using Framer Motion. |
| `IconButton` | Small square icon button. |

### Admin Components (`src/components/admin/`)

| Component | Description |
|---|---|
| `AdminDashboardCard` | Dashboard card shown on `/dashboard` — only visible to admin users. Links to the admin hub. |
| `AdminStatCard` | Stat card with a customizable primary-color accent bar. |
| `AdminPageHeader` | Standard sticky page header with title, subtitle, and optional action button. |
| `AdminNavCard` | Navigation card linking to admin sub-pages with icon and description. |
| `AdminQuickLinks` | Pill-style quick link badges for navigating admin sections. |
| `EmptyState` | Reusable empty state with icon, title, description, and optional children. |
| `SearchInput` | Search input with magnifying glass icon. |
| `TimeRangeSelector` | Toggle buttons for selecting day ranges (7d, 14d, 30d, 90d). |
| `ExerciseListCard` | Exercise row with edit and delete buttons. |
| `UserCard` | User info card with role badge and change role button. |
| `TemplateCard` | Official template row with "Official" badge and delete button. |
| `ConfirmDeleteModal` | Reusable delete confirmation modal. |
| `RoleChangeModal` | Radio-button modal for changing user roles (client ↔ admin). |
| `DailyWorkoutsChart` | Recharts bar chart for daily workout counts. |
| `TopExercisesList` | Ranked list of most-used exercises. |

### Workout

| Component | Description |
|---|---|
| `WorkoutExerciseCard` | Per-exercise card inside the active workout builder. Editable sets with confirm / delete per row. |
| `ExerciseSearchModal` | Full-screen search modal for adding exercises to a workout. |
| `TemplateCard` | Template tile with edit, delete, and exercise count icons. |
| `CreateTemplateModal` | Multi-step modal to name and select exercises for a new template. |
| `CancelWorkoutModal` | Confirmation modal for discarding the active workout. |
| `FinishWorkoutModal` | Confirmation modal for completing the active workout. |
| `DiscardSetsModal` | Confirmation modal when switching template while a workout has unsaved sets. |

### History

| Component | Description |
|---|---|
| `WorkoutHistoryCard` | Summary card for a past workout: name, date, volume, duration, PR count, top exercises. |
| `WorkoutHistoryExerciseCard` | Compact exercise row inside the history detail page. |

### Progress & Profile

| Component | Description |
|---|---|
| `WeightHistoryChart` | Recharts line chart of bodyweight over time. |
| `WeightLogCard` | Single weight entry with date, weight, and delete button. |
| `AddWeightModal` | Date + weight form modal. |
| `WorkoutCalendar` | Month-view calendar highlighting days with completed workouts. |
| `ExerciseStatsTab` | Volume-over-time line chart for a single exercise. |
| `PersonalRecordCard` | Displays the PR (weight × reps) for an exercise with the date it was set. |
| `ProgressPhotoCard` | Photo thumbnail with body-part tag, notes, date, and delete button. |
| `AddPhotoModal` | File upload + body-part selector + notes modal for adding a progress photo. |
| `ExerciseCard` | Exercise tile used in both the library list and the search modal. |

### AI Coach

| Component | Description |
|---|---|
| `CoachSidebar` | Collapsible conversation list sidebar (desktop) / slide-in drawer (mobile). |
| `CoachTextWindow` | Scrollable message area with empty-state suggestions. |
| `CoachTextArea` | Text input with send button at the bottom of the chat panel. |
| `MessageBubble` | Individual message rendering with user/assistant avatars. |
| `QuickSuggestions` | Pre-built prompt chips shown on empty state. |
| `ExpiredWorkoutCard` | Stale workout suggestion card with "Recreate with current data" button. |

### Gamification

| Component | Description |
|---|---|
| `XPLevelCard` | Displays current XP, level, and a progress bar to the next level. |
| `AchievementsPanel` | List of all achievements with unlock status and claim buttons. |
| `AchievementsTeaserCard` | Compact achievement preview shown on the dashboard. |

---

## Hooks

All hooks are in `src/hooks/` and use `fetch()` to call Next.js API routes. They return loading/error state alongside the data.

| Hook | Description |
|---|---|
| `useAuth` | `login`, `signup`, `logout`, `getSession` |
| `useExercises` | Fetch exercises with pagination and debounced search |
| `useWorkout` | Create, update, finish, and resume draft workouts; manage sets per exercise |
| `useHistory` | Fetch and delete past workouts (paginated) |
| `useWeightLogs` | Fetch, add, and delete weight log entries |
| `usePersonalRecords` | Fetch, add, update, and delete PRs per exercise |
| `useProgressPhotos` | Fetch, upload, and delete progress photos |
| `useWorkoutTemplates` | Fetch, create, update, and delete workout templates |
| `useUserExercises` | Manage per-user exercise library and favourites |
| `useAIChat` | AI chat with SSE streaming, conversation history (save/load/delete), and workout action detection |

---

## Authentication & Data

- **Session management**: `@supabase/ssr` stores the session in an HTTP-only cookie. The Next.js API routes read and refresh it on every request.
- **API routes** (`src/app/api/`): The only place where `SUPABASE_URL` and `SUPABASE_ANON_KEY` are used. Never exposed to the browser.
- **Protected pages**: Every page inside `(main)/` is wrapped in `ProtectedWrapper`, which calls `/api/auth/session` and redirects to `/login` if the session is missing.
- **Row-level security**: All Supabase tables use RLS policies so users can only access their own data. Admin-managed tables (`exercises`, `achievements`) have additional RLS policies that check `user_stats.role = 'admin'`.
- **Ownership checks in code**: Every mutating API route verifies that the target resource belongs to the authenticated user, providing defense-in-depth alongside RLS.

---

## Admin System

### Role Model

Admin privileges are controlled via a `role` column on the `user_stats` table:
```sql
role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin'))
```

To promote a user to admin, run in the Supabase SQL Editor:
```sql
UPDATE public.user_stats SET role = 'admin' WHERE user_id = '<your-user-uuid>';
```

### Enforcement

Admin access is enforced at **two layers**:
1. **RLS policies** — Database-level policies check `EXISTS (SELECT 1 FROM user_stats WHERE user_id = auth.uid() AND role = 'admin')`
2. **Code-level guard** — The `requireAdmin()` helper in `src/helper/supabaseServer.ts` returns a 403 if the user's role is not `admin`

### Admin Pages

| Page | Description |
|---|---|
| `/admin` | Hub with quick stats and navigation cards to all admin sections |
| `/admin/exercises` | Full CRUD for the standard exercise catalogue — search, add, edit, delete |
| `/admin/users` | List all users with XP, level, workout count, and role. Promote/demote users between client and admin |
| `/admin/templates` | Create and delete official workout templates visible to all users |
| `/admin/analytics` | Platform-wide metrics: total users, active users, workouts, sets, volume, daily workout chart, top exercises |

### Admin API Routes

| Route | Methods | Description |
|---|---|---|
| `/api/admin/exercises` | POST | Insert a standard exercise |
| `/api/admin/exercises/[id]` | PUT, DELETE | Update or delete a standard exercise |
| `/api/admin/users` | GET | List all users with stats |
| `/api/admin/users/[id]/role` | PUT | Change a user's role |
| `/api/admin/templates` | POST | Create an official workout template |
| `/api/admin/templates/[id]` | PUT, DELETE | Update or delete an official template |
| `/api/admin/analytics` | GET | Platform-wide analytics data |

### Admin Visibility

An "Admin Dashboard" card appears on the main `/dashboard` page **only** for users with `role = 'admin'`. It shows quick stats and links to the admin hub.

---

## UI & Styling

- **Tailwind CSS** is used for all layout and utility styling.
- **Custom CSS variables** in `globals.css` define the full design token system:
  - Colours (`--background`, `--surface`, `--foreground`, `--muted-foreground`, `--border`, `--primary-*`, `--color-success`, `--color-destructive`, …)
  - Radius tokens (`--radius-sm` through `--radius-xl`)
  - Shadow tokens (`--shadow-xs` through `--shadow-lg`)
  - All tokens have dark-mode equivalents under `.dark`.
- **Lucide React** provides every icon. Icons are imported individually so tree-shaking keeps the bundle small.
- **Framer Motion** handles modal entrance/exit animations.
- **Recharts** powers the weight-history and exercise-stats charts.
- **Mobile layout**: Fixed top bar (`h-11`, `z-20`) + bottom tab bar. A same-height spacer div prevents content from being hidden under the top bar.
- **Desktop layout**: Sticky left sidebar (`w-60`) with gradient background and a dark-mode toggle in the footer.

---

## Setup & Usage

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/AndreiMunteanu2911/workout-tracker.git
   cd workout-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Configure environment variables**

   Copy the example file and fill in your Supabase credentials:
   ```bash
   cp .env.example .env.local
   ```

   `.env.local`:
   ```env
   SUPABASE_URL=https://<your-project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your-anon-key>
   ```

   > **Security note**: These are *server-only* variables (no `NEXT_PUBLIC_` prefix). They are never sent to the browser.

   **Optional: AI Coach** — To enable the AI-powered fitness coach, add your OpenRouter API key (free tier, no credit card required):
   ```env
   OPENROUTER_API_KEY=sk-or-your-key-here
   OPENROUTER_CHAT_MODEL=qwen/qwen3.6-plus:free
   OPENROUTER_FALLBACK_MODEL=stepfun/step-3.5-flash:free
   OPENROUTER_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free
   ```
   Get your key at [openrouter.ai/keys](https://openrouter.ai/keys).

4. **Run database migrations**

   Open the Supabase SQL Editor and run the migration files in `migrations/` **in numerical order** (`001_extensions.sql` through `017_ai_messages.sql`). These create all tables, indexes, triggers, RLS policies, and seed data.

5. **Promote a user to admin** *(optional)*

   In Supabase SQL Editor:
   ```sql
   UPDATE public.user_stats SET role = 'admin' WHERE user_id = '<your-user-uuid>';
   ```

6. **Create the storage bucket**

   In Supabase Dashboard → Storage, create a bucket named `progress-photos` (private).

7. **Seed the exercise library** *(optional)*

   Populate the `exercises` table using the [ExerciseDB](https://www.exercisedb.dev/docs) dataset or via the admin panel at `/admin/exercises`.

8. **Start the development server**
   ```bash
   npm run dev
   ```

9. **Open the app**

   Navigate to [http://localhost:3000](http://localhost:3000).

---

## Dark Mode

FitPulse ships with a polished dark mode:

- Toggle via the **Sun / Moon** icon in the desktop sidebar footer.
- Theme preference is persisted to `localStorage` via **Zustand**.
- `ThemeProvider` applies the `dark` class to `<html>` synchronously on mount (no flash of wrong theme).
- Every component is styled for both themes using the CSS variable system.
- Custom scrollbars adapt to the active theme.
- Modals animate in/out smoothly with Framer Motion regardless of theme.

---

## Database Structure (Supabase)

### Core Tables

#### `exercises`
Master exercise library (seeded data, admin-managed).
```sql
exercise_id      text PRIMARY KEY,
name             text NOT NULL,
gif_url          text,
target_muscles   text,
body_parts       text,
equipments       text
```

#### `custom_exercises`
User-created custom exercises.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
name        text NOT NULL,
body_part   text,
created_at  timestamptz DEFAULT now()
```

#### `workouts`
User workout sessions.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
name         text DEFAULT 'My Workout',
workout_date date DEFAULT CURRENT_DATE,
status       text DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
finished_at  timestamptz,
created_at   timestamptz DEFAULT now()
```

#### `workout_exercises`
Exercises within a workout (ordered).
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
workout_id  uuid REFERENCES workouts(id) ON DELETE CASCADE,
exercise_id text NOT NULL,
order_index integer DEFAULT 0
```

#### `sets`
Individual sets within a workout exercise.
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
workout_exercise_id  uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
set_number           integer DEFAULT 1,
reps                 integer DEFAULT 0,
weight               numeric(10,2) DEFAULT 0
```

### Progress Tracking Tables

#### `weight_logs`
User bodyweight entries over time.
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
log_date   date NOT NULL,
weight     numeric(6,2) NOT NULL
```

#### `personal_records`
Best lift per exercise per user.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
exercise_id  text NOT NULL,
max_weight   numeric(10,2) DEFAULT 0,
max_reps     integer DEFAULT 0,
workout_date date NOT NULL,
created_at   timestamptz DEFAULT now(),
updated_at   timestamptz DEFAULT now(),
UNIQUE (user_id, exercise_id)
```

#### `progress_photos`
User progress photos with optional notes.
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
photo_url  text NOT NULL,
log_date   date DEFAULT CURRENT_DATE,
notes      text,
created_at timestamptz DEFAULT now()
```

### User Library Tables

#### `user_exercises`
Per-user exercise favourites.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
exercise_id text NOT NULL,
is_favorite boolean DEFAULT true,
created_at  timestamptz DEFAULT now(),
UNIQUE (user_id, exercise_id)
```

#### `workout_templates`
Saved workout templates.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
name        text NOT NULL,
description text,
is_official boolean DEFAULT false,
created_at  timestamptz DEFAULT now(),
updated_at  timestamptz DEFAULT now()
```

#### `template_exercises`
Exercises within a template.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
exercise_id text NOT NULL,
order_index integer DEFAULT 0
```

### Gamification Tables

#### `user_stats`
XP bank and level per user.
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id              uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
total_xp             integer DEFAULT 0,
level                integer DEFAULT 1,
streak_freeze_count  integer DEFAULT 0,
role                 text DEFAULT 'client' CHECK (role IN ('client', 'admin')),
created_at           timestamptz DEFAULT now(),
updated_at           timestamptz DEFAULT now()
```

#### `achievements`
Static achievement catalogue (seeded).
```sql
id          text PRIMARY KEY,
uuid        uuid DEFAULT gen_random_uuid(),
name        text NOT NULL,
description text NOT NULL,
icon        text NOT NULL,
xp_reward   integer DEFAULT 0,
category    text NOT NULL CHECK (category IN ('workouts','streaks','records','volume'))
```

#### `user_achievements`
Unlocked achievements per user.
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE,
achievement_id  text REFERENCES achievements(id),
unlocked_at     timestamptz DEFAULT now(),
UNIQUE (user_id, achievement_id)
```

### AI Coach Tables

#### `ai_conversations`
User AI coach conversations.
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
title      text NOT NULL,
created_at timestamptz DEFAULT now(),
updated_at timestamptz DEFAULT now()
```

#### `ai_messages`
Messages within a conversation.
```sql
id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
conversation_id  uuid REFERENCES ai_conversations(id) ON DELETE CASCADE,
role             text NOT NULL CHECK (role IN ('user', 'assistant')),
content          text NOT NULL,
created_at       timestamptz DEFAULT now()
```

### Indexes

```sql
CREATE INDEX idx_custom_exercises_user_id ON custom_exercises(user_id);
CREATE INDEX idx_custom_exercises_user_name ON custom_exercises(user_id, name);
CREATE INDEX idx_workouts_user_status ON workouts(user_id, status);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date DESC);
CREATE INDEX idx_we_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_sets_we_id ON sets(workout_exercise_id);
CREATE INDEX idx_pr_user_id ON personal_records(user_id);
CREATE INDEX idx_weight_logs_user_date ON weight_logs(user_id, log_date ASC);
CREATE INDEX idx_photos_user_date ON progress_photos(user_id, log_date DESC);
CREATE INDEX idx_templates_user_id ON workout_templates(user_id);
CREATE INDEX idx_te_template_id ON template_exercises(template_id);
CREATE INDEX idx_user_exercises_user_id ON user_exercises(user_id);
CREATE INDEX idx_ua_user_id ON user_achievements(user_id);
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_user_updated ON ai_conversations(user_id, updated_at DESC);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_conversation_created ON ai_messages(conversation_id, created_at ASC);
```

### Row-Level Security (RLS)

All tables have RLS enabled. The policies follow two patterns:

- **User-owned data**: `USING (auth.uid() = user_id)` — users can only see/modify their own rows.
- **Admin-managed data** (`exercises`, `achievements`): Public read for standard entries + admin-only INSERT/UPDATE/DELETE via `role = 'admin'` check.
- **Official templates**: Visible to all users when `is_official = true`, owned by the creating admin user.

---

## Database Schema Diagram

```
auth.users (Supabase Auth)
    │
    ├─── workouts ──────────► workout_exercises ──────────► exercises (admin-managed)
    │        │                       │
    │        │                       ▼
    │        │                    sets
    │        │
    │        └── workout_templates ──► template_exercises
    │                  │
    │                  └── is_official (visible to all)
    │
    ├─── custom_exercises
    │
    ├─── weight_logs
    │
    ├─── personal_records
    │
    ├─── progress_photos  (images in Supabase Storage)
    │
    ├─── user_exercises
    │
    ├─── user_stats ──► role (client / admin)
    │       │
    │       └─── user_achievements ──► achievements (admin-managed, public read)
    │
    └─── ai_conversations ──► ai_messages
```

### Foreign Key Relationships

- All user-specific tables reference `auth.users(id)` with `ON DELETE CASCADE`.
- `workout_exercises` references `workouts(id)` with cascade delete (no FK to `exercises` — resolved in application layer).
- `sets` references `workout_exercises(id)` with cascade delete.
- `template_exercises` references `workout_templates(id)` with cascade delete (no FK to `exercises` — resolved in application layer).
- `personal_records` has a unique constraint on `(user_id, exercise_id)` — one PR per exercise per user.
- `user_exercises` has a unique constraint on `(user_id, exercise_id)`.
- `ai_conversations` references `auth.users(id)` — one conversation per user.
- `ai_messages` references `ai_conversations(id)` with cascade delete.

### Storage Bucket

- **progress-photos**: Private Supabase Storage bucket for user progress photos.
  - Path structure: `{user_id}/{timestamp}-{filename}`
  - The public URL is stored in `progress_photos.photo_url`.

---

## Migrations

The database is managed through individual migration files in `migrations/`, run in numerical order:

| File | Purpose |
|---|---|
| `001_extensions.sql` | pgcrypto extension + `set_updated_at()` trigger function |
| `002_exercises.sql` | exercises table + public-read RLS + admin-manage RLS |
| `003_custom_exercises.sql` | custom_exercises table + indexes + RLS |
| `004_workouts.sql` | workouts table + indexes + RLS |
| `005_workout_exercises.sql` | workout_exercises table + index + RLS |
| `006_sets.sql` | sets table + index + RLS |
| `007_personal_records.sql` | personal_records table + index + RLS |
| `008_weight_logs.sql` | weight_logs table + index + RLS |
| `009_progress_photos.sql` | progress_photos table + index + RLS |
| `010_workout_templates.sql` | workout_templates table + `is_official` column + index + RLS |
| `011_template_exercises.sql` | template_exercises table + index + RLS |
| `012_user_exercises.sql` | user_exercises table + index + RLS |
| `013_user_stats.sql` | user_stats table + `role` column + trigger + RLS |
| `014_achievements.sql` | achievements table + `uuid` column + seed data + RLS |
| `015_user_achievements.sql` | user_achievements table + index + RLS |
| `016_ai_conversations.sql` | ai_conversations table + indexes + trigger + RLS |
| `017_ai_messages.sql` | ai_messages table + indexes + RLS |

---

## Credits

- Exercise data powered by [ExerciseDB](https://www.exercisedb.dev/docs)
- Icons from [Lucide](https://lucide.dev/)
- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), and [Recharts](https://recharts.org/)
