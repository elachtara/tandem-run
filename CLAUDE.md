# Tandem Run — Project Context for Claude Code :) 

## Product Overview
Tandem Run is a women-only running and walking partner app launching in Boston, Summer 2026. We match women 1:1 with one compatible running partner based on pace, schedule, neighborhood, and social preferences. Not a run club — just you and your person.

## Brand
- **Name:** Tandem Run
- **Colors:** Navy (#1c3f7a), Gold (#F5C842), White
- **Typography:** Playfair Display Bold Italic for accent text (especially "Run"), sans-serif bold for primary text
- **Tone:** Warm, confident, safety-first, inclusive, never corporate
- **Tagline:** "Your running buddy is out there."

## Tech Stack
- **Frontend:** Expo + React Native with TypeScript
- **Backend:** Supabase (Postgres + Auth + Storage + Realtime + Edge Functions)
- **Maps:** Mapbox
- **ID Verification:** Persona or Stripe Identity (TBD)
- **Push Notifications:** Expo Notifications
- **Error Tracking:** Sentry
- **Analytics:** PostHog or Mixpanel

## Core Values (Non-Negotiable)
1. **Safety first** — every feature must be evaluated through a safety lens for women meeting strangers
2. **Inclusive by design** — open to all who identify as women, including transgender and nonbinary individuals in women-centered spaces
3. **1:1, not a group** — matching is always one woman to one woman
4. **Verified profiles** — ID verification is a core trust feature, not optional
5. **Build with AI, ship with care** — vibe coding is the tool, but safety features need human review

## Target User
Women aged 18-45 in Boston metro. Runners, walkers, and women who want to move more. Safety-conscious, community-oriented, digitally native.

## Key Features (MVP)
- Email/password auth + magic link
- Onboarding with safety agreement
- Identity verification (government ID + selfie)
- Profile creation (pace, schedule, neighborhood, preferences, accessibility)
- Matching algorithm (1 match per day)
- Match acceptance flow
- Run proposal + acceptance + negotiation
- In-app messaging (unlocks after run confirmed)
- Live location sharing during runs
- Check-in system + emergency contacts
- Community feed (post-run selfies + routes)
- Push notifications
- Block, report, admin moderation

## Database Schema (Planned)
Tables to implement:
- users (auth managed by Supabase)
- profiles (name, photo, pace, neighborhood, schedule, preferences)
- verifications (ID verification status)
- matches (user_a, user_b, compatibility_score, status)
- runs (proposed_by, match_id, date, distance, route, status)
- messages (run_id, sender_id, content, read_at)
- posts (user_id, photo, caption, route_data)
- post_likes, post_comments
- reports (reporter_id, reported_id, reason, status)
- blocks (blocker_id, blocked_id)

## Code Conventions
- TypeScript for everything
- Functional components with hooks
- Supabase client wrapped in custom hooks
- Row-level security on every table (never bypass RLS)
- Component files co-located with styles
- Prefer named exports
- Use absolute imports (configured in tsconfig)
- Tests for critical logic (matching algorithm, safety flows)

## Safety & Privacy Requirements
- Never expose user emails or phone numbers to other users
- Location data only shared with consented match during active run
- All photos moderated before appearing in feed (at least automated)
- Reports trigger admin review queue
- Block immediately hides all content between users
- Account deletion must truly delete data (not just hide)

## File Structure
/app            # Expo Router screens
/components     # Reusable UI components
/hooks          # Custom React hooks
/lib            # Supabase client, utilities
/types          # TypeScript types
/constants      # Colors, fonts, config
/services       # API calls, business logic
/admin          # Admin dashboard (separate web app)

## Current Phase
Building MVP, targeting public launch by mid-September 2026. Currently at [update this as you progress].

## My Working Style
- I'm vibe coding — rely on AI heavily but want to understand key decisions
- I'm a data scientist, new to mobile dev but comfortable with TypeScript
- Prefer clean, readable code over clever code
- Safety features need extra scrutiny — never cut corners
- I'll test on my own phone frequently via Expo Go