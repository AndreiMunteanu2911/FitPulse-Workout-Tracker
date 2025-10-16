# Workout Tracker

A modern web application to log, track, and manage your workouts and fitness progress. Built with Next.js, React, Supabase, and Tailwind CSS.

## 🚀 Features
- **User Authentication:** Sign up, login, and protected routes using Supabase Auth.
- **Dashboard:** Overview of your workout stats and quick navigation.
- **Workout Management:** Add, edit, and delete workouts. Resume draft workouts.
- **Exercise Management:** Search, add, and manage exercises for each workout.
- **Workout History:** View detailed history of past workouts, including exercises, sets, and total volume.
- **Profile:** Manage your user profile and sign out.
- **Responsive UI:** Mobile-friendly design with a bottom navbar and modern card components.

## 🛠️ Tech Stack
- [Next.js](https://nextjs.org/) (React framework)
- [React](https://react.dev/)
- [Supabase](https://supabase.com/) (Auth & Database)
- [Tailwind CSS](https://tailwindcss.com/)
- TypeScript

## 📁 Main Components
- `Button`, `Navbar`, `ExerciseCard`, `ExerciseSearchModal`, `WorkoutExerciseCard`, `WorkoutHeader`, `WorkoutHistoryCard`, `ResumeDraftPrompt`, `ProtectedWrapper`

## 🎨 Assets
Custom SVG icons for dashboard, exercises, history, profile, and workout are located in `public/assets/`.

## 📋 TODO / Possible Improvements
- Add more detailed error handling and user feedback
- Implement analytics/statistics for workouts
- Enhance mobile experience further
- Add social/sharing features
- Implement a visual chart to track exercise improvement over time

## 🏁 Getting Started
1. Clone the repo
2. Install dependencies with `pnpm install`
3. Set up your Supabase project and add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the development server:
   - `pnpm dev`

---

Feel free to contribute or open issues for suggestions and improvements!
