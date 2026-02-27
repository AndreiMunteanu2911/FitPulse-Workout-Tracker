# FitPulse Workout Tracker

[Visit Live Vercel Deployment](https://fitpulseam.vercel.app)

FitPulse is a web application for tracking workouts, exercises, and weight progress. It is built with Next.js (App Router), React, Supabase, and Tailwind CSS. The app provides a responsive, modern interface for logging workouts, viewing history, and managing fitness data.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Pages](#pages)
- [Components](#components)
- [Hooks](#hooks)
- [Authentication & Data](#authentication--data)
- [Assets & Styling](#assets--styling)
- [Setup & Usage](#setup--usage)
- [Dark Mode](#dark-mode)
- [Database Structure (Supabase)](#database-structure-supabase)
- [Database Schema Diagram](#database-schema-diagram)

## Features
- User authentication (sign up, login, protected routes) via Supabase Auth
- Dashboard overview with stats
- Workout management: create, edit, delete, and resume draft workouts
- Exercise management: search, view, and add exercises to workouts
- Workout history: detailed view of past workouts, sets, and volume
- Weight tracking: log and visualize weight history with interactive charts
- Personal records tracking for each exercise
- Progress photos with body part categorization
- Workout templates for quick workout creation
- User exercise library with favorites
- Profile management and sign out
- Full dark mode support with smooth animations
- Responsive design: sidebar for desktop, bottom navbar for mobile

## Architecture
- **Next.js App Router**: All pages are in `src/app/` using layouts and nested routing
- **Frontend / Backend split**:
  - **Backend** — Next.js API routes (`src/app/api/`) handle all Supabase interactions server-side. Supabase credentials are kept in server-only environment variables and are never sent to the browser.
  - **Frontend** — React components call the API routes via custom hooks (`src/hooks/`). No direct Supabase access from client code.
  - **Session management** — `@supabase/ssr` is used for cookie-based authentication so the server can verify identity on every request.
- **Supabase**: Used for authentication and as the backend database (accessed only from API routes)
- **Tailwind CSS**: Utility-first styling with custom CSS variables for theming
- **Component-based**: All UI elements are modular React components in `src/components/`
- **State Management**: Zustand for theme persistence, React hooks for data fetching

## Pages
- **Landing (`(auth)/page.tsx`)**: Welcome page with sign up and login links
- **Login (`(auth)/login/page.tsx`)**: User login form, handles Supabase auth
- **Sign Up (`(auth)/signup/page.tsx`)**: User registration form, handles Supabase auth
- **Dashboard (`(main)/dashboard/page.tsx`)**: User stats and workout overview (protected)
- **Workout (`(main)/workout/page.tsx`)**: Main workout builder and tracker. Add exercises, sets, reps, and weights. Modals for finishing/cancelling workouts. (protected)
- **Exercises (`(main)/exercises/page.tsx`)**: Infinite scroll/searchable list of all exercises. (protected)
- **Exercise Details (`(main)/exercises/[id]/page.tsx`)**: Detailed view for a single exercise. (protected)
- **History (`(main)/history/page.tsx`)**: List of all past workouts with summary info. (protected)
- **Workout Details (`(main)/history/[id]/page.tsx`)**: Full breakdown of a specific past workout. (protected)
- **Profile (`(main)/profile/page.tsx`)**: User profile, weight log, weight chart, and sign out. (protected)

## Components

### Core Components
- **Navbar**: Responsive navigation (sidebar on desktop, bottom bar on mobile)
- **Button**: Reusable button with variants (primary, secondary, textOnly)
- **ModalWrapper**: Animated modal container with Framer Motion transitions
- **ScrollbarContainer**: Custom scrollbar styling wrapper
- **ProtectedWrapper**: HOC to enforce authentication on protected pages
- **LoadingSpinner**: Animated spinner for loading states
- **ErrorBoundary**: Error boundary for graceful error handling
- **ThemeProvider**: Dark mode theme provider with localStorage persistence
- **DarkModeToggle**: Toggle button for dark/light mode

### Workout Components
- **ExerciseCard**: Displays exercise info, links to details
- **ExerciseSearchModal**: Modal for searching/selecting exercises
- **WorkoutExerciseCard**: Card for managing sets/reps/weight for an exercise in a workout
- **WorkoutHistoryCard**: Card summarizing a past workout
- **WorkoutHistoryExerciseCard**: Card showing details for an exercise in a past workout
- **CancelWorkoutModal**: Modal to confirm discarding a workout
- **FinishWorkoutModal**: Modal to confirm finishing a workout

### Progress Components
- **WeightHistoryChart**: Line chart of weight logs (uses recharts)
- **WeightLogCard**: Displays a single weight log entry
- **AddWeightModal**: Modal for adding a new weight log
- **StatCard**: Dashboard stat display card

## Hooks
- **useAuth**: Login, signup, logout, session management
- **useExercises**: Fetch exercises with pagination and search
- **useWorkout**: Create, update, finish workouts; manage sets
- **useHistory**: Fetch workout history
- **useWeightLogs**: Fetch, add, delete weight logs
- **usePersonalRecords**: Fetch, add, update, delete personal records
- **useProgressPhotos**: Fetch, upload, delete progress photos
- **useWorkoutTemplates**: Fetch, create, update, delete workout templates
- **useUserExercises**: Manage user exercise library and favorites

## Authentication & Data
- **Session management**: `@supabase/ssr` manages auth sessions via HTTP-only cookies set by the server
- **API routes** (`src/app/api/`): All Supabase interactions happen here, keeping credentials server-side only
- **Custom hooks** (`src/hooks/`): Wrap `fetch()` calls to the API routes
- All protected pages/components use `ProtectedWrapper` to redirect unauthenticated users (checks `/api/auth/session`)
- Supabase URL and keys are stored as server-only env vars (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) — **not** prefixed with `NEXT_PUBLIC_`

## Assets & Styling
- All SVG icons and images are in `public/assets/`
- Tailwind CSS is used for all styling
- Custom CSS variables defined in `globals.css` for theming
- Dark mode colors use the same hue palette for consistency

## Setup & Usage
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up a Supabase project and add the following environment variables (copy `.env.example` to `.env.local`):
   - `SUPABASE_URL` — your Supabase project URL
   - `SUPABASE_ANON_KEY` — your Supabase anonymous/public key
4. Run the database migrations in Supabase SQL Editor
5. Create a storage bucket named `progress-photos` in Supabase Storage (public bucket)
6. Start the development server: `pnpm dev`
7. Access the app at `http://localhost:3000`

> **Security note**: The Supabase credentials are stored as server-only variables (no `NEXT_PUBLIC_` prefix). They are only accessible inside Next.js API routes and are never sent to the browser.

## Dark Mode
FitPulse features a complete dark mode implementation:
- Toggle via the sun/moon icon in the navigation
- Theme preference persisted in localStorage
- Instant theme switch with no flash of wrong theme
- All components styled for both light and dark modes
- Custom scrollbars that adapt to theme
- Smooth modal animations with Framer Motion

## Database Structure (Supabase)

Below is the complete database schema for FitPulse:

### Core Tables

#### exercises
Master exercise library (seeded data).
```sql
exercise_id text PRIMARY KEY,
name text NOT NULL,
gif_url text,
target_muscles text[],
body_parts text[],
equipments text[],
secondary_muscles text[],
instructions text[]
```

#### workouts
User workout sessions.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
workout_date date NOT NULL,
created_at timestamp DEFAULT now(),
name text DEFAULT 'My Workout',
status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed'))
```

#### workout_exercises
Exercises within a workout.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id),
order_index integer DEFAULT 0
```

#### sets
Individual sets within a workout exercise.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
set_number integer NOT NULL,
reps integer NOT NULL,
weight numeric(5,2)
```

### Progress Tracking Tables

#### weight_logs
User weight entries over time.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
log_date date NOT NULL,
weight numeric(5,2) NOT NULL,
created_at timestamp DEFAULT now()
```

#### personal_records
User's best lifts per exercise.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id) ON DELETE CASCADE,
max_weight numeric(6,2) DEFAULT 0,
max_reps integer DEFAULT 0,
workout_date date NOT NULL,
created_at timestamp,
updated_at timestamp,
UNIQUE (user_id, exercise_id)
```

#### progress_photos
User progress photos with body part categorization.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
photo_url text NOT NULL,
log_date date DEFAULT CURRENT_DATE,
notes text,
body_part text
```

### User Library Tables

#### user_exercises
User's personal exercise library and favorites.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id) ON DELETE CASCADE,
is_favorite boolean DEFAULT true,
created_at timestamp DEFAULT now(),
UNIQUE (user_id, exercise_id)
```

#### workout_templates
Saved workout templates for quick creation.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
name text NOT NULL,
description text,
created_at timestamp DEFAULT now(),
updated_at timestamp DEFAULT now()
```

#### template_exercises
Exercises within a template.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
template_id uuid REFERENCES workout_templates(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id) ON DELETE CASCADE,
order_index integer DEFAULT 0,
created_at timestamp DEFAULT now(),
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

## Database Schema Diagram

```
auth.users (Supabase Auth)
    │
    ├─────────────────────────────────────────────────────────────┐
    │                                                             │
    ▼                                                             ▼
workouts ──────────► workout_exercises ──────────► exercises      user_exercises ─────┐
    │                      │                           ▲                               │
    │                      ▼                           │                               │
    │                   sets                           │                               │
    │                                                  │                               │
    │                                                  │                               │
    ├──────────────────────────────────────────────────┘                               │
    │                                                                                  │
    ▼                                                                                  │
workout_templates ────────► template_exercises ────────────────────────────────────────┘
                                                                        (references exercise_id)
    │
    ▼
weight_logs

personal_records ───────────────────────────────────────────────────► exercises

progress_photos (stores images in Supabase Storage bucket: progress-photos)
```

### Foreign Key Relationships
- All user-specific tables reference `auth.users(id)` with `ON DELETE CASCADE`
- `workout_exercises` references both `workouts(id)` and `exercises(exercise_id)`
- `sets` references `workout_exercises(id)` with cascade delete
- `template_exercises` references both `workout_templates(id)` and `exercises(exercise_id)`
- `personal_records` has unique constraint on `(user_id, exercise_id)` for one PR per exercise
- `user_exercises` has unique constraint on `(user_id, exercise_id)` for one entry per exercise

### Storage Bucket
- **progress-photos**: Public bucket for storing user progress photos
  - Path structure: `{user_id}/{timestamp}-{filename}`
  - Images are publicly accessible via URL stored in `progress_photos.photo_url`

---

## Credits
- Exercise data powered by [ExerciseDB](https://www.exercisedb.dev/docs)
- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), and [Tailwind CSS](https://tailwindcss.com/)
