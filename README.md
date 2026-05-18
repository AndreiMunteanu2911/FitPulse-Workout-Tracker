# FitPulse - Workout Tracker

[Live deployment](https://fitpulseam.vercel.app)

Android APK builds are available on the [GitHub Releases page](https://github.com/AndreiMunteanu2911/FitPulse-Workout-Tracker/releases).

FitPulse is a mobile-first fitness platform for logging workouts, tracking progress, reviewing lifting form, building habits, and sharing training updates with a community. It is built with Next.js App Router, React 19, Supabase, Tailwind CSS, Framer Motion, Recharts, Stripe, MediaPipe, and a Capacitor-based Android shell.

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
- It uses MediaPipe pose tracking, smoothed landmarks with visibility decay, calibration hysteresis, stable joint status, and rep-based scoring to estimate quality without single-frame flicker.
- Detection runs at a controlled cadence, prevents overlapping pose inference, and shows one shared spinner while the first landmarks are loading so the camera startup does not feel frozen.
- The local pattern engine supports angle, distance, vertical/horizontal delta, joint velocity, torso angle, and relative-position checks while keeping saved exercise rule mappings lightweight.
- Rule effects separate coaching from invalid movement: red `rep_gate` rules can reject fake or unsafe reps, yellow score-penalty rules affect rep quality, and `cue_only` hints guide the user without materially changing the score.
- Endpoint-aware rules evaluate lockout, depth, finish, or bottom-position requirements only near the expected end of the phase, so completion cues can be strict without flashing during normal movement.
- Finished sets stop the camera, save a local analysis, and show a post-set review with a score band, exact percentage, realtime score, post-set score, main cues, and optional AI coach feedback.
- The score model groups repeated cues by category per rep, weights penalties by tracking confidence, and applies small consistency/fatigue adjustments from completed reps rather than frame-by-frame warning spam.
- When available, the app asks the cloud coaching layer for a second-pass summary of the set. If the provider is slow or unavailable, the review falls back to the local analysis instead of blocking the user.
- The same exercise system supports custom exercises and admin-managed rule mappings, so the library can grow with the user's training style.

### Progress and gamification

- The profile area tracks bodyweight over time, shows a chart of the trend, and lets users add or delete individual weigh-ins.
- Progress photos give users a visual before/after record with notes and body-part tags instead of only relying on numbers.
- The workout calendar highlights training days so consistency is visible at a glance.
- XP, levels, and achievements turn regular logging into a progression system, with claimable rewards when the user hits milestones.
- The dashboard shows a compact achievement progress card, and the achievements page groups badges by workouts, streaks, records, and volume with clear locked, ready, and claimed states.
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
| Android shell | Capacitor 8 |
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
- Client API calls should use `apiFetch` where possible so auth redirects, network failures, and non-JSON errors are handled consistently.
- API routes are the only place where Supabase credentials are used, which keeps the browser bundle free of backend credentials.
- Session state is read through `@supabase/ssr` and stored in HTTP-only cookies.
- The main layout checks `onboarding_done` and redirects incomplete users into the onboarding flow before they reach protected pages.
- Database access is protected with row-level security and code-level ownership checks.
- Admin access is enforced by the `role` field in `user_stats` and the `requireAdmin()` helper.
- The UI is responsive: desktop uses a sticky left sidebar and content area, while mobile uses a fixed top bar and bottom tab navigation.
- Loading states use the shared `LoadingSpinner` component. The app avoids skeleton placeholders and should show only one primary spinner per screen-level loading surface.
- Theme preference is persisted and applied without a flash of the wrong theme.
- Android builds use Capacitor as a native container. In production the Android app boots into a branded shell and forwards users into the hosted FitPulse app. In development the Android emulator can point directly at a local Next.js dev server.
- Shared domain logic lives in `src/lib/`:
  - `ai.ts`, `rag-context.ts`, `rag-intent.ts`, and `workout-generator.ts` implement the AI coach and draft workout generation.
  - `form-rules.ts`, `form-analysis.ts`, `form-coaching.ts`, `form-geometry.ts`, and `pose-detector.ts` implement the form checker pipeline, including local pattern evaluation, endpoint-aware rules, landmark smoothing, rep scoring, and post-set coaching fallback.
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
git clone https://github.com/AndreiMunteanu2911/FitPulse-Workout-Tracker.git
cd FitPulse-Workout-Tracker
pnpm install
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in the values for your environment.

```env
# App environment
CAP_APP_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_PRODUCTION_APP_URL=https://fitpulseam.vercel.app
CAP_ANDROID_DEV_SERVER_URL=http://10.0.2.2:3000

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
STRIPE_ALLOWED_SHIPPING_COUNTRIES=US,CA,GB,AU,DE,FR,NL,BE,ES,IT,PT,RO
```

Notes:

- `CAP_APP_ENV` / `NEXT_PUBLIC_APP_ENV` control whether Capacitor should behave as a local development shell or a production shell.
- `NEXT_PUBLIC_PRODUCTION_APP_URL` is the hosted FitPulse URL the Android app should use outside of local development.
- `CAP_ANDROID_DEV_SERVER_URL` is the Android emulator address for your local Next.js server. `10.0.2.2` maps back to your host machine from the emulator.
- The client Supabase helper uses the `NEXT_PUBLIC_*` variables.
- Server routes and admin helpers use the non-public Supabase variables.
- The AI coach and form coaching can fall back through built-in models if your preferred OpenRouter model is unavailable.

### Environment modes

For local web and Android emulator work:

```env
CAP_APP_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_PRODUCTION_APP_URL=https://fitpulseam.vercel.app
CAP_ANDROID_DEV_SERVER_URL=http://10.0.2.2:3000
```

For production / Vercel:

```env
CAP_APP_ENV=production
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_PRODUCTION_APP_URL=https://fitpulseam.vercel.app
```

On Vercel, copy the values from `.env.production` into the Production environment and replace the placeholder secrets with your real production keys.

### Database setup

Run the migrations in `migrations/` in numeric order. The current schema covers:

- Core training: exercises, custom exercises, workouts, sets, templates, and favorites
- Progress: weight logs, personal records, and progress photos
- AI and gamification: conversations, messages, user stats, achievements, and unlocked achievements
- Form analysis: form rules and form logs
- Community: friendships, posts, likes, and comments
- Content: blog posts, likes, and comments
- Commerce: products and orders

Form checker persistence stays compatible with the `form_logs` shape. Recent form checker improvements are client-side analysis, smoothing, rep-based scoring, score-band metadata, and review UI changes rather than schema changes.

Form rules remain backwards compatible with the existing `form_rules` data model. Database rows continue to store the exercise-to-pattern mapping, primary metric, view, confidence, overrides, and review metadata. The richer movement logic lives in the local pattern catalogue, where each reusable rule can declare:

- `kind`: `angle`, `distance`, `vertical_delta`, `horizontal_delta`, `joint_velocity`, `torso_angle`, or `relative_position`
- `category`: `range_of_motion`, `tempo`, `stability`, `symmetry`, `posture`, `tracking`, or `other`
- `effect`: `score_penalty`, `cue_only`, or `rep_gate`
- `evaluationTiming`: `phase`, `phase_endpoint`, or `always`

This keeps admin overrides and saved logs compatible while letting patterns such as curls, squats, presses, pulls, hinges, lunges, raises, calf raises, and carries become stricter and more specific without a migration.

### Storage buckets

Create the Supabase Storage buckets used by the app:

- `progress-photos`
- `post-images`
- `blog-images`
- `product-images`

### Run the app

```bash
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

### Run the Android app

Capacitor and the Android project are already set up in this repository.

For local Android emulator development:

1. Start the Next.js dev server.

```bash
pnpm dev
```

2. Sync the Android project.

```bash
pnpm exec cap sync android
```

3. Open the Android project in Android Studio.

```bash
pnpm exec cap open android
```

4. Run the `app` target on an emulator or connected device.

Notes:

- Local Android development uses `CAP_ANDROID_DEV_SERVER_URL`, which defaults to `http://10.0.2.2:3000`.
- `10.0.2.2` is the Android emulator alias for your host machine.
- Stripe checkout on Android opens in the native browser/custom tab rather than staying inside the WebView.
- Progress photo capture uses Capacitor Camera on Android.
- The realtime form checker relies on `getUserMedia` and MediaPipe in the WebView. That feature requires an HTTPS context. It may not work from local cleartext emulator dev (`http://10.0.2.2:3000`) and should be validated against a hosted HTTPS build for full parity.
- Form checker camera lifecycle is controlled by the form checker component. The camera starts for detection, stops for review, and should not restart while the saved review is open.

### Build the Android shell for production

1. Set the app environment to production in your local env or CI env.
2. Sync the Android project:

```bash
pnpm exec cap sync android
```

3. Build and sign from Android Studio or your Gradle release pipeline.

In production mode the Android app uses the branded Capacitor shell and forwards users into the hosted FitPulse app at `NEXT_PUBLIC_PRODUCTION_APP_URL`.

## Scripts

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build the production app |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run the headless Vitest suite once |
| `pnpm test:watch` | Run the headless Vitest suite in watch mode |
| `pnpm test:coverage` | Run Vitest with coverage output |
| `pnpm form-rules:generate` | Generate form rule data |
| `pnpm form-rules:import` | Import generated form rules |
| `pnpm exec cap sync android` | Sync Capacitor config and assets into the Android project |
| `pnpm exec cap open android` | Open the Android project in Android Studio |

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
