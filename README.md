# FitPulse Workout Tracker

FitPulse is a web application for tracking workouts, exercises, and weight progress. It is built with Next.js (App Router), React, Supabase, and Tailwind CSS. The app provides a responsive, modern interface for logging workouts, viewing history, and managing fitness data.

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Pages](#pages)
- [Components](#components)
- [Authentication & Data](#authentication--data)
- [Assets & Styling](#assets--styling)
- [Setup & Usage](#setup--usage)
- [Improvements](#improvements)
- [Database Structure (Supabase)](#database-structure-supabase)

## Features
- User authentication (sign up, login, protected routes) via Supabase Auth
- Dashboard overview
- Workout management: create, edit, delete, and resume draft workouts
- Exercise management: search, view, and add exercises to workouts
- Workout history: detailed view of past workouts, sets, and volume
- Weight tracking: log and visualize weight history
- Profile management and sign out
- Responsive design: sidebar for desktop, bottom navbar for mobile

## Architecture
- **Next.js App Router**: All pages are in `src/app/` using layouts and nested routing
- **Supabase**: Used for authentication and as the backend database
- **Tailwind CSS**: Utility-first styling
- **Component-based**: All UI elements are modular React components in `src/components/`

## Pages
- **Landing (`(auth)/page.tsx`)**: Welcome page with sign up and login links
- **Login (`(auth)/login/page.tsx`)**: User login form, handles Supabase auth
- **Sign Up (`(auth)/signup/page.tsx`)**: User registration form, handles Supabase auth
- **Dashboard (`(main)/dashboard/page.tsx`)**: Placeholder for user stats/overview (protected)
- **Workout (`(main)/workout/page.tsx`)**: Main workout builder and tracker. Add exercises, sets, reps, and weights. Modals for finishing/cancelling workouts. (protected)
- **Exercises (`(main)/exercises/page.tsx`)**: Infinite scroll/searchable list of all exercises. (protected)
- **Exercise Details (`(main)/exercises/[id]/page.tsx`)**: Detailed view for a single exercise. (protected)
- **History (`(main)/history/page.tsx`)**: List of all past workouts with summary info. (protected)
- **Workout Details (`(main)/history/[id]/page.tsx`)**: Full breakdown of a specific past workout. (protected)
- **Profile (`(main)/profile/page.tsx`)**: User profile, weight log, weight chart, and sign out. (protected)

## Components
- **Navbar**: Responsive navigation (sidebar on desktop, bottom bar on mobile)
- **Button**: Reusable button with variants (primary, secondary, textOnly)
- **IconButton**: Button with an icon, used for navigation and actions
- **ProtectedWrapper**: HOC to enforce authentication on protected pages
- **LoadingSpinner**: Animated spinner for loading states
- **ExerciseCard**: Displays exercise info, links to details
- **ExerciseSearchModal**: Modal for searching/selecting exercises
- **WorkoutExerciseCard**: Card for managing sets/reps/weight for an exercise in a workout
- **WorkoutHistoryCard**: Card summarizing a past workout
- **WorkoutHistoryExerciseCard**: Card showing details for an exercise in a past workout
- **WeightHistoryChart**: Line chart of weight logs (uses recharts)
- **WeightLogCard**: Displays a single weight log entry
- **AddWeightModal**: Modal for adding a new weight log
- **CancelWorkoutModal**: Modal to confirm discarding a workout
- **FinishWorkoutModal**: Modal to confirm finishing a workout

## Authentication & Data
- **Supabase** is initialized in `src/helper/supabaseClient.js` using environment variables
- All protected pages/components use `ProtectedWrapper` to redirect unauthenticated users
- Data is fetched and mutated using Supabase client methods (e.g., `.from('workouts')`, `.from('exercises')`)
- Weight logs, workouts, and exercises are all stored in Supabase tables

## Assets & Styling
- All SVG icons and images are in `public/assets/`
- Tailwind CSS is used for all styling
- Custom color variables are defined for theming

## Setup & Usage
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Set up a Supabase project and add the following environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Start the development server: `pnpm dev`
5. Access the app at `http://localhost:3000`

## Improvements
- Improve dashboard with user stats and summaries
- Add analytics/statistics for workouts and exercises
- Visual charts for exercise progress

## Database Structure (Supabase)

Below is an overview of the main tables used in Supabase for FitPulse:

### exercises
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

### sets
```sql
id uuid PRIMARY KEY,
workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
set_number integer NOT NULL,
reps integer NOT NULL,
weight numeric(5,2)
```

### weight_logs
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
log_date date NOT NULL,
weight numeric(5,2) NOT NULL,
created_at timestamp DEFAULT now()
```

### workout_exercises
```sql
id uuid PRIMARY KEY,
workout_id uuid REFERENCES workouts(id) ON DELETE CASCADE,
exercise_id text REFERENCES exercises(exercise_id),
order_index integer DEFAULT 0
```

### workouts
```sql
id uuid PRIMARY KEY,
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
workout_date date NOT NULL,
created_at timestamp DEFAULT now(),
name text DEFAULT 'My Workout',
status text DEFAULT 'draft' CHECK (status IN ('draft', 'completed'))
```

> All foreign keys are enforced and cascade deletes are used for user and workout relationships
