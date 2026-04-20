# FitPulse - Workout Tracker

[Live deployment](https://fitpulseam.vercel.app)

FitPulse is a mobile-first fitness platform for logging workouts, tracking progress, reviewing lifting form, building habits, and sharing training updates with a community. It is built with Next.js App Router, React 19, Supabase, Tailwind CSS, Framer Motion, Recharts, Stripe, and MediaPipe.

## Overview

This README focuses on the implementation surface: route groups, feature domains, API boundaries, storage, and the modules that power each workflow.

## Feature Map

### Identity and onboarding

- Signup creates an account with a display name, email, and password, then sends new users into onboarding.
- The onboarding flow asks for gender, age, weight, and height so the app can personalize profile stats and recommendations.
- When onboarding is complete, the app stores the profile data and marks the account as ready for the main app.
- `ProtectedWrapper` and the authenticated layout keep partially configured users inside the onboarding flow until they finish.

### Training core

- The workout builder is the main logging flow: start a session, add movements, enter sets, and finish when the session is done.
- It supports templates for repeatable routines, plus custom exercises when the standard library does not cover what the user wants to log.
- Each exercise card lets the user edit reps and weight, confirm completed sets, and see previous-session numbers for comparison.
- The inline rest timer appears under confirmed sets so the user can keep moving without losing track of recovery time.
- Cancel and finish dialogs protect against losing progress, and template-switch warnings prevent accidental data loss.
- Finished workouts can be shared to the social feed, which turns the workout into a post instead of just a private record.

### Exercise library and form checker

- The exercise library gives users a searchable catalog of movements they can add to workouts or mark as favorites for faster access later.
- Exercise detail pages show how the movement looks, what muscles it targets, how the user has performed on it before, and the latest session history.
- The form checker lets users record a set with the camera running and receive realtime coaching cues while they move.
- It uses pose tracking and rule-based scoring to estimate rep quality, then stores the finished analysis for later review.
- When available, the app also asks the cloud coaching layer for a second-pass summary of the set so users get both instant and post-set feedback.
- The same exercise system supports custom exercises and admin-managed rule mappings, so the library can grow with the user's training style.

### Progress and gamification

- The profile area tracks bodyweight over time, shows a chart of the trend, and lets users add or delete individual weigh-ins.
- Progress photos give users a visual before/after record with notes and body-part tags instead of only relying on numbers.
- The workout calendar highlights training days so consistency is visible at a glance.
- XP, levels, and achievements turn regular logging into a progression system, with claimable rewards when the user hits milestones.
- The dashboard surfaces the most important progress signals together so the user can see momentum without opening multiple pages.

### AI coach

- The AI coach answers questions about the user's own training history, progress, and recovery context instead of generic fitness advice.
- Users can ask for recommendations, interpret trends, or generate a workout draft they can start right away.
- Conversations persist so users can come back to previous chats instead of starting over every time.
- The OpenRouter fallback chain keeps the coach usable even when a preferred model is unavailable.

### Social, blog, and shop

- The social feed lets users share updates, react to other people's posts, and keep up with friends inside the app.
- Workout shares turn completed training sessions into social posts with a summary of the workout attached.
- The blog gives users a place to read longer fitness content, leave comments, and interact with admin-published posts.
- The shop lets users browse products, start a Stripe checkout flow, and return to a success page after payment.
- Admin order tools keep track of what was purchased, whether it was shipped or cancelled, and which shipping details were captured.

### Administration

- The admin area is where trusted users maintain the platform content and operational data.
- Exercise catalogue tools support creating, editing, and deleting standard exercises used throughout the app.
- Form-rule tools let admins inspect and refine AI-generated movement mappings and mark them for review when needed.
- User management supports role changes between client and admin.
- Template management publishes official workout templates that regular users can reuse.
- Analytics, shop, and order views help admins understand usage and keep the store operational.

## Routes

### Public and auth

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create an account |
| `/checkout-success` | Stripe checkout completion screen |

### Onboarding flow

| Route | Purpose |
| --- | --- |
| `/onboarding/gender` | Choose gender |
| `/onboarding/age` | Set age |
| `/onboarding/weight` | Log initial weight |
| `/onboarding/height` | Set height and finish onboarding |
| `/onboarding/complete` | Completion screen |

### Protected app

| Route | Purpose |
| --- | --- |
| `/dashboard` | Stats, shortcuts, XP, achievements preview |
| `/workout` | Active workout builder |
| `/history` | Workout history list |
| `/history/[id]` | Workout detail and editing |
| `/exercises` | Exercise library |
| `/exercises/[id]` | Exercise detail, PRs, charts, form checker |
| `/profile` | Profile, weight logs, calendar, photos |
| `/achievements` | Achievement catalogue and claim flow |
| `/ai-coach` | AI chat coach |
| `/blog` | Fitness blog |
| `/blog/[id]` | Blog post detail |
| `/social` | Social feed and friends |
| `/shop` | Product store |
| `/admin` | Admin hub |
| `/admin/exercises` | Exercise catalogue management |
| `/admin/form-rules` | Form rule review and editing |
| `/admin/users` | User and role management |
| `/admin/templates` | Official workout templates |
| `/admin/analytics` | Platform analytics |
| `/admin/shop` | Product management |
| `/admin/orders` | Order management |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19 |
| Styling | Tailwind CSS v4, CSS variables, custom theme tokens |
| Animation | Framer Motion |
| Charts | Recharts |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth with `@supabase/ssr` |
| Storage | Supabase Storage |
| Validation | Zod |
| State | Zustand and React state/hooks |
| AI | OpenRouter |
| Pose tracking | MediaPipe Tasks Vision |
| Payments | Stripe |
| Icons | Lucide React |
| Language | TypeScript |

## Architecture

- The app is split into route groups. `(auth)` holds the public login, signup, and onboarding flow. `(main)` holds the protected app shell and all authenticated pages.
- Client components are thin shells over reusable hooks. Hooks call Next.js API routes, not Supabase directly.
- API routes are the only place where Supabase credentials are used, which keeps the browser bundle free of backend credentials.
- Session state is read through `@supabase/ssr` and stored in HTTP-only cookies.
- The main layout checks `onboarding_done` and redirects incomplete users into the onboarding flow before they reach protected pages.
- Database access is protected with row-level security and code-level ownership checks.
- Admin access is enforced by the `role` field in `user_stats` and the `requireAdmin()` helper.
- The UI is responsive: desktop uses a sticky left sidebar and content area, while mobile uses a fixed top bar and bottom tab navigation.
- Theme preference is persisted and applied without a flash of the wrong theme.
- Shared domain logic lives in `src/lib/`:
  - `ai.ts`, `rag-context.ts`, `rag-intent.ts`, and `workout-generator.ts` implement the AI coach and draft workout generation.
  - `form-rules.ts`, `form-analysis.ts`, `form-coaching.ts`, `form-geometry.ts`, and `pose-detector.ts` implement the form checker pipeline.
  - `gamification.ts` computes XP, levels, streaks, and achievement unlock state.
  - `exercise-index.ts` resolves library and custom exercises for search and workout generation.
  - `navigation.ts` defines the desktop/mobile nav items.
- Media uploads use Supabase Storage buckets for progress photos, social posts, blog images, and product images.
- Stripe checkout is handled on the server, with order records stored in the `orders` table and confirmed through the checkout-success page.
- The social feed, blog, and shop all use the same protected shell but different API domains and storage buckets.

## Setup

### Prerequisites

- Node.js 18 or newer
- A Supabase project
- Stripe test keys if you want to exercise the shop flow locally
- An OpenRouter API key if you want the AI coach and form coaching features enabled

### Install

```bash
git clone https://github.com/AndreiMunteanu2911/workout-tracker.git
cd workout-tracker
npm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values for your environment.

```env
# Supabase
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Optional AI features
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_CHAT_MODEL=qwen/qwen3-next-80b-a3b-instruct:free
OPENROUTER_FALLBACK_MODEL=qwen/qwen3-coder:free
OPENROUTER_FALLBACK_MODEL_2=stepfun/step-3.5-flash:free
OPENROUTER_FALLBACK_MODEL_3=minimax/minimax-m2.5:free
OPENROUTER_FALLBACK_MODEL_4=openai/gpt-oss-20b:free
OPENROUTER_FALLBACK_MODEL_5=google/gemma-3-4b-it:free
OPENROUTER_FALLBACK_MODEL_6=meta-llama/llama-3.2-3b-instruct:free
OPENROUTER_FALLBACK_MODEL_LAST=openrouter/free
OPENROUTER_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Notes:

- The client Supabase helper uses the `NEXT_PUBLIC_*` variables.
- Server routes and admin helpers use the non-public Supabase variables.
- The AI coach and form coaching can fall back through built-in models if your preferred OpenRouter model is unavailable.

### Database setup

Run the migrations in `migrations/` in numeric order. The current schema covers:

- Core training: exercises, custom exercises, workouts, sets, templates, and favorites
- Progress: weight logs, personal records, and progress photos
- AI and gamification: conversations, messages, user stats, achievements, and unlocked achievements
- Form analysis: form rules and form logs
- Community: friendships, posts, likes, and comments
- Content: blog posts, likes, and comments
- Commerce: products and orders

### Storage buckets

Create the Supabase Storage buckets used by the app:

- `progress-photos`
- `post-images`
- `blog-images`
- `product-images`

### Run the app

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production app |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run form-rules:generate` | Generate form rule data |
| `npm run form-rules:import` | Import generated form rules |

## Database Notes

### Main training tables

- `exercises`
- `custom_exercises`
- `workouts`
- `workout_exercises`
- `sets`
- `workout_templates`
- `template_exercises`
- `user_exercises`
- `personal_records`

### Progress and profile tables

- `weight_logs`
- `progress_photos`
- `user_stats`

### AI and gamification tables

- `achievements`
- `user_achievements`
- `ai_conversations`
- `ai_messages`
- `form_logs`

### Community, content, and commerce tables

- `friendships`
- `posts`
- `post_likes`
- `post_comments`
- `blog_posts`
- `blog_likes`
- `blog_comments`
- `products`
- `orders`

### Security

- RLS is enabled across the schema.
- User-owned tables only expose rows owned by the signed-in user.
- Admin-managed data such as exercises, form rules, achievements, blog content, and products is protected by role checks.

## Credits

- Exercise data from [ExerciseDB](https://www.exercisedb.dev/docs)
- Icons from [Lucide](https://lucide.dev/)
- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), [Tailwind CSS](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/), [Recharts](https://recharts.org/), [Stripe](https://stripe.com/), and [MediaPipe](https://developers.google.com/mediapipe)
