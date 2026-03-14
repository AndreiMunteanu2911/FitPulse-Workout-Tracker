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
- **Progress Photos** — Upload photos with a body-part tag and optional notes; delete any photo. Photos are stored in a public Supabase Storage bucket.
- **Workout Templates** — Save and manage reusable workout templates. Start a new workout directly from a template.
- **User Exercise Library & Favourites** — Mark exercises as favourites for quick access.
- **Dark Mode** — Fully themed light/dark mode with instant toggle (no flash), persisted to localStorage via Zustand.
- **Responsive Layout** — Desktop sidebar + main content area; mobile fixed top bar + bottom tab navigation.
- **Icons** — Every icon in the app is sourced from **Lucide React** for consistent, crisp vector icons at every size.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| UI Library | React 18 |
| Styling | Tailwind CSS + custom CSS variables |
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
└─────────────────────────┬───────────────────────────┘
                          │ Supabase JS SDK
┌─────────────────────────▼───────────────────────────┐
│                      Supabase                        │
│                                                      │
│  • PostgreSQL database (all user data)               │
│  • Supabase Auth (session management)                │
│  • Supabase Storage (progress photos)                │
└─────────────────────────────────────────────────────┘
```

### Key architectural decisions

- **No direct Supabase access from client code.** All database reads and writes go through Next.js API routes, keeping credentials server-only.
- **Cookie-based sessions via `@supabase/ssr`.** The server verifies the user's identity on every API request without exposing tokens to JavaScript.
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
| `/dashboard` | `dashboard/page.tsx` | Stats overview, weekly histogram, templates carousel |
| `/workout` | `workout/page.tsx` | Active workout builder — add exercises, log sets, finish/cancel |
| `/exercises` | `exercises/page.tsx` | Searchable infinite-scroll exercise library |
| `/exercises/[id]` | `exercises/[id]/page.tsx` | Exercise detail: GIF, muscles, PRs, stats chart |
| `/history` | `history/page.tsx` | Paginated list of completed workouts with quick edit/delete |
| `/history/[id]` | `history/[id]/page.tsx` | Full workout detail with inline set editing |
| `/profile` | `profile/page.tsx` | User info, workout calendar, weight log + chart, progress photos |

---

## Components

### Layout & Navigation

| Component | Description |
|---|---|
| `Navbar` | Desktop sidebar + mobile bottom tab bar. Uses Lucide icons for each tab. |
| `TopBar` | Fixed mobile-only top bar showing the current page title and a Dumbbell logo on the right. Rendered above a same-height spacer so content is never hidden beneath it. |
| `ProtectedWrapper` | Client HOC that checks `/api/auth/session`. Redirects unauthenticated users to `/`. |
| `ThemeProvider` | Applies `dark` class to `<html>` on mount based on persisted theme. |
| `DarkModeToggle` | Sun/Moon toggle button (Lucide icons) that switches and persists the theme. |
| `ScrollbarContainer` | Thin wrapper that applies custom scrollbar styles. |
| `ErrorBoundary` | React error boundary for graceful degradation. |
| `LoadingSpinner` | Animated CSS spinner for async states. |

### Core UI

| Component | Description |
|---|---|
| `Button` | Polymorphic button with `primary`, `secondary`, and `textOnly` variants. |
| `StatCard` | Dashboard stat tile: title, value, subtitle, optional trend indicator and icon. |
| `ModalWrapper` | Animated modal backdrop + card using Framer Motion. |
| `IconButton` | Small square icon button. |

### Workout

| Component | Description |
|---|---|
| `WorkoutExerciseCard` | Per-exercise card inside the active workout builder. Editable sets with confirm (Check) / delete (X) per row and an Add Set button. |
| `ExerciseSearchModal` | Full-screen search modal for adding exercises to a workout. |
| `TemplateCard` | Template tile with edit (PenSquare), delete (Trash2), and exercise count (List) icons. |
| `CreateTemplateModal` | Multi-step modal to name and select exercises for a new template. |
| `CancelWorkoutModal` | Confirmation modal for discarding the active workout (X icon). |
| `FinishWorkoutModal` | Confirmation modal for completing the active workout (Check icon). |
| `DiscardSetsModal` | Confirmation modal when switching template while a workout has unsaved sets. |

### History

| Component | Description |
|---|---|
| `WorkoutHistoryCard` | Summary card for a past workout: name, date, volume badge (Zap), duration badge (Clock), PR count badge (Sparkles), top exercises. |
| `WorkoutHistoryExerciseCard` | Compact exercise row inside the history detail page. |

### Progress & Profile

| Component | Description |
|---|---|
| `WeightHistoryChart` | Recharts line chart of bodyweight over time. |
| `WeightLogCard` | Single weight entry with date, weight, and delete button (Trash2). |
| `AddWeightModal` | Date + weight form modal. |
| `WorkoutCalendar` | Month-view calendar highlighting days with completed workouts. Uses ChevronLeft/ChevronRight navigation. |
| `ExerciseStatsTab` | Volume-over-time line chart for a single exercise on the exercise detail page. |
| `PersonalRecordCard` | Displays the PR (weight × reps) for an exercise with the date it was set. |
| `ProgressPhotoCard` | Photo thumbnail with body-part tag, notes, date, and a delete button (Trash2). |
| `AddPhotoModal` | File upload + body-part selector + notes modal for adding a progress photo (ImageIcon upload prompt). |
| `ExerciseCard` | Exercise tile used in both the library list and the search modal. |

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

---

## Authentication & Data

- **Session management**: `@supabase/ssr` stores the session in an HTTP-only cookie. The Next.js API routes read and refresh it on every request.
- **API routes** (`src/app/api/`): The only place where `SUPABASE_URL` and `SUPABASE_ANON_KEY` are used. Never exposed to the browser.
- **Protected pages**: Every page inside `(main)/` is wrapped in `ProtectedWrapper`, which calls `/api/auth/session` and redirects to `/` if the session is missing.
- **Row-level security**: All Supabase tables use `user_id = auth.uid()` RLS policies so users can only access their own data.

---

## UI & Styling

- **Tailwind CSS** is used for all layout and utility styling.
- **Custom CSS variables** in `globals.css` define the full design token system:
  - Colours (`--background`, `--surface`, `--foreground`, `--muted-foreground`, `--border`, `--primary-*`, `--color-success`, `--color-destructive`, …)
  - Radius tokens (`--radius-sm` through `--radius-xl`)
  - Shadow tokens (`--shadow-sm`, `--shadow`, `--shadow-md`)
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

4. **Run database migrations**

   Open the Supabase SQL Editor and run the migration SQL to create all tables, indexes, and RLS policies (see [Database Structure](#database-structure-supabase) below).

5. **Create the storage bucket**

   In Supabase Storage, create a **public** bucket named `progress-photos`.

6. **Seed exercises** *(optional)*

   Populate the `exercises` table using the [ExerciseDB](https://www.exercisedb.dev/docs) dataset or a custom seed script.

7. **Start the development server**
   ```bash
   npm run dev
   ```

8. **Open the app**

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
Master exercise library (seeded data, read-only for users).
```sql
exercise_id      text PRIMARY KEY,
name             text NOT NULL,
gif_url          text,
target_muscles   text[],
body_parts       text[],
equipments       text[],
secondary_muscles text[],
instructions     text[]
```

#### `workouts`
User workout sessions.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
workout_date date NOT NULL,
created_at   timestamp DEFAULT now(),
finished_at  timestamp,
name         text DEFAULT 'My Workout',
status       text DEFAULT 'draft' CHECK (status IN ('draft', 'completed'))
```

#### `workout_exercises`
Exercises within a workout (ordered).
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
workout_id  uuid REFERENCES workouts(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id),
order_index integer DEFAULT 0
```

#### `sets`
Individual sets within a workout exercise.
```sql
id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
workout_exercise_id  uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
set_number           integer NOT NULL,
reps                 integer NOT NULL,
weight               numeric(5,2)
```

### Progress Tracking Tables

#### `weight_logs`
User bodyweight entries over time.
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
log_date   date NOT NULL,
weight     numeric(5,2) NOT NULL,
created_at timestamp DEFAULT now()
```

#### `personal_records`
Best lift per exercise per user.
```sql
id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
exercise_id  text REFERENCES exercises(exercise_id) ON DELETE CASCADE,
max_weight   numeric(6,2) DEFAULT 0,
max_reps     integer DEFAULT 0,
workout_date date NOT NULL,
created_at   timestamp,
updated_at   timestamp,
UNIQUE (user_id, exercise_id)
```

#### `progress_photos`
User progress photos with optional body-part tag.
```sql
id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
photo_url text NOT NULL,
log_date  date DEFAULT CURRENT_DATE,
notes     text,
body_part text
```

### User Library Tables

#### `user_exercises`
Per-user exercise favourites.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id) ON DELETE CASCADE,
is_favorite boolean DEFAULT true,
created_at  timestamp DEFAULT now(),
UNIQUE (user_id, exercise_id)
```

#### `workout_templates`
Saved workout templates.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
name        text NOT NULL,
description text,
created_at  timestamp DEFAULT now(),
updated_at  timestamp DEFAULT now()
```

#### `template_exercises`
Exercises within a template.
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id) ON DELETE CASCADE,
order_index integer DEFAULT 0,
created_at  timestamp DEFAULT now(),
UNIQUE (template_id, exercise_id)
```

### Indexes

```sql
-- Personal Records
CREATE INDEX idx_personal_records_user ON personal_records(user_id);

-- Progress Photos
CREATE INDEX idx_progress_photos_user ON progress_photos(user_id);

-- User Exercises
CREATE INDEX idx_user_exercises_user ON user_exercises(user_id);

-- Workout Templates
CREATE INDEX idx_workout_templates_user ON workout_templates(user_id);

-- Template Exercises
CREATE INDEX idx_template_exercises_template ON template_exercises(template_id);
```

### Row-Level Security (RLS)

Enable RLS on all user-data tables and add a policy such as:
```sql
CREATE POLICY "Users can only access their own data"
  ON workouts FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```
Repeat for `workout_exercises`, `sets`, `weight_logs`, `personal_records`, `progress_photos`, `user_exercises`, `workout_templates`, and `template_exercises`.

---

## Database Schema Diagram

```
auth.users (Supabase Auth)
    │
    ├─── workouts ──────────► workout_exercises ──────────► exercises
    │        │                       │                          ▲
    │        │                       ▼                          │
    │        │                    sets                          │
    │        │                                                  │
    │        └── workout_templates ──► template_exercises ──────┘
    │
    ├─── weight_logs
    │
    ├─── personal_records ──────────────────────────────► exercises
    │
    ├─── progress_photos  (images in Supabase Storage)
    │
    └─── user_exercises ────────────────────────────────► exercises
```

### Foreign Key Relationships

- All user-specific tables reference `auth.users(id)` with `ON DELETE CASCADE`.
- `workout_exercises` references both `workouts(id)` and `exercises(exercise_id)`.
- `sets` references `workout_exercises(id)` with cascade delete.
- `template_exercises` references both `workout_templates(id)` and `exercises(exercise_id)`.
- `personal_records` has a unique constraint on `(user_id, exercise_id)` — one PR per exercise per user.
- `user_exercises` has a unique constraint on `(user_id, exercise_id)`.

### Storage Bucket

- **progress-photos**: Public Supabase Storage bucket for user progress photos.
  - Path structure: `{user_id}/{timestamp}-{filename}`
  - The public URL is stored in `progress_photos.photo_url`.

---

## Credits

- Exercise data powered by [ExerciseDB](https://www.exercisedb.dev/docs)
- Icons from [Lucide](https://lucide.dev/)
- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), and [Recharts](https://recharts.org/)
