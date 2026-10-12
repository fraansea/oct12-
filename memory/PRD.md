# Roomie — PRD

## Problem statement
Complete production-ready roommate / shared-living management app: household chores, kitchen inventory with expiry, grocery list, shared expenses with settle-up, virtual shared food budget, and a Gemini-powered Kitchen AI that suggests meals from what's at home (prioritising near-expiry items and budget). Premium consumer design: off-white base, near-black accents, oversized numbers, large rounded cards, floating black pill nav.

## Stack (as deployed)
- **Frontend:** Expo (React Native + web), expo-router, @tanstack/react-query, Supabase JS, reanimated, react-native-keyboard-controller
- **Backend:** FastAPI at /api — only AI routes (Gemini 3 Flash via Emergent universal key), verifies Supabase JWT via JWKS (ES256)
- **DB/Auth/Realtime:** Supabase project `chodcbmrjkruaigrevfj` (region ap-southeast-1). Schema in /app/backend/schema.sql (tables, RLS via is_household_member/is_household_owner, invite RPCs get_household_by_invite/join_household, realtime publication). Extra FK added later: household_members.user_id → profiles.id (needed for PostgREST embeds)
- Product name/currency in /app/frontend/src/config.ts; theme tokens in /app/frontend/src/theme.ts

## Test accounts (see /app/memory/test_credentials.md)
- john@roomie.app / RoomieDemo123 (owner of "Palm House", invite PALM26)
- alex@roomie.app / RoomieDemo123 (member)

## Implemented (2026-09-30, MVP Phase 1)
- Auth: email+password (signup/login/forgot), Google button wired (provider pending user-side Google OAuth setup)
- Onboarding: create house (6-char invite code, copy/share), join by code with household preview, dietary preferences
- Home: greeting, giant budget metric, frosted sub-tiles, AI hero, metric grid (tasks/groceries/inventory/you-owe), today's tasks, use-soon carousel
- Tasks: segments Today/Upcoming/Done, All/Mine, stats (week/pending/streak), create with assignee/date-strip/time/priority/recurrence/rotation, complete→next occurrence + rotation, notifications to assignee
- Inventory: giant count, search, category pills, expiring hero, quick-add chips, detail with Use Item (quantity deduction, zero→grocery prompt), edit, low-stock tags
- Groceries: All/Needed/Purchased, add sheet, purchase flow (→ inventory + expense + budget deduction, one step), source labels
- Expenses: monthly total (grey decimals), category cards, filters, split Equal/Custom(validated)/Only-me, balances "X owes Y", Mark Settled (settlements table)
- Food budget: available/contributions/spent, contribute + budget expense, history with signed amounts
- Kitchen AI: quick actions (incl. No-Spend max_spend=0, Under ₹100/₹200), free text, structured meal cards, Cook This (confirmed inventory deduction), Add Missing → groceries (source ai_meal), friendly error + retry, history persisted
- Notifications: fan-out on task/grocery/expense events, Today/Earlier groups, mark read/all
- Household: invite code copy/share, members with role/task-count/contribution, owner remove member
- Realtime sync on all shared tables (unique channel topics per hook instance — fixed iter-1 crash)
- Offline banner (netinfo), toasts (no Alerts), skeletons, empty states everywhere

## Testing
- Iteration 1: all flows pass after tester fixed realtime duplicate-channel crash; FK gap found
- Iteration 2: FK verified, member names/splits/notifications/household/budget all pass; pytest 7/7 backend

## Restore & fixes (2026-10-03)
- App arrived as a zip with **no `.env` files** → both services were down. Restored:
  - `/app/frontend/.env` (backend URL + packager host + EXPO_PUBLIC_SUPABASE_URL/KEY)
  - `/app/backend/.env` (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, EMERGENT_LLM_KEY)
- New Supabase project `qgenemhetpmfunphlrbe` — verified full schema already applied (all tables + RPCs present, no data). Backend healthy (`/api/health` ok), frontend welcome/login render.
- **Google sign-in fixed (code):** switched Supabase client to `flowType: "pkce"`; welcome.tsx now uses `Linking.createURL("auth/callback")` (was hardcoded wrong scheme `roomie://`) and completes the PKCE `exchangeCodeForSession(code)` on native; web auto-exchanges. GhostButton gained loading state.
- **Open user-side Supabase config (cannot be done from code):**
  - "Confirm email" is ON → new signups get `email_not_confirmed` on login. Disable it (Auth → Providers → Email) for immediate login, or confirm via email.
  - Google: enable provider + add Google Cloud OAuth client + redirect URLs (see test_credentials.md).

## Google sign-in verified (2026-10-03)
- User configured Google provider in Supabase (client_id 348788962911-...). Verified server-side: `/auth/v1/authorize?provider=google` 302s to accounts.google.com. testing_agent (iteration_3) confirmed the in-app "Continue with Google" button launches the flow and reaches Google's sign-in page with correct client_id/redirect_uri/scope. Login screen reachable + renders.
- Still pending (user-side): "Confirm email" toggle is still ON (email login returns email_not_confirmed); turn OFF in Auth → Providers → Email for immediate email logins. Ensure the exact preview origin shown in the browser is in Supabase → Redirect URLs (with /**).

## Bug fix: bottom sheets couldn't be dismissed (2026-10-03)
- Symptom (iOS/Expo Go): "Add grocery item" / "Quick add" sheets opened with no dim backdrop and could not be closed.
- Root cause: `src/components/sheets.tsx` animated the scrim with react-native-reanimated inside an RN `<Modal>`; Reanimated animated styles aren't reliably committed inside a Modal on iOS, so the scrim was invisible AND un-tappable.
- Fix: rewrote `Sheet` with React Native core `Animated` + `PanResponder`. Added visible close button (testID `sheet-close`), kept backdrop tap (testID `sheet-scrim`), added swipe-down-to-dismiss, and mount/unmount via internal `rendered` state so exit animation plays. Verified by testing_agent iteration_4 (X button, backdrop tap, action button, reopen all pass on web; swipe validated by code, not automatable on web).

## UI redesign — "Tactile / Playful" (2026-10-12)
- New visual language from user-provided references: vibrant solid accent cards (hero lime #DDF73E + lavender/yellow/mint/blue/pink pastels), warm off-white canvas, oversized mixed-weight Outfit headlines, black-pill primary CTAs & segmented toggles, hashtag chips, circular black/white icon buttons, floating pill bottom-nav (already matched).
- Fonts: added Outfit (display) + Plus Jakarta Sans (text) as static per-weight TTFs in assets/fonts, loaded via expo-font useFonts in app/_layout.tsx (render gated on fontsLoaded).
- theme.ts: full palette rewrite; kept every existing key (+ gradient tokens repointed to pastels) so no screen breaks; added accent tokens + `font` map.
- core.tsx (shared primitives → propagate app-wide): restyled PrimaryButton/GhostButton, SegmentedControl & PillRow (black active pill), SectionHeader + new Display headline (Outfit), StatusTag (pastel), Avatar tones, MetricTile/GiantMetric numbers (Outfit). Added ColorCard, Chip, CircleButton, useAccent.
- Home (tabs/index.tsx) fully redesigned: oversized greeting, lime budget hero, 2×2 pastel stat grid with circular buttons, ink AI card with chips. Welcome screen restyled (Outfit wordmark, lime badge).
- Verified via temporary no-auth design-preview route (now removed) + welcome screenshot. NOTE: authenticated screens couldn't be auto-tested because email login is still blocked by the user's Supabase "Confirm email" setting.

## Backlog (static)
- **P0 (user-side):** enable Google provider (OAuth client steps already provided); rotate the leaked sb_secret key
- **P1 (Phase 2):** calendar (month/agenda), shared notes (sensitive hidden), AI meal planner (daily/3-day/weekly), notification settings per category, reminders, universal search
- **P2 (Phase 3):** analytics cards, push notifications (needs native build), auto low-stock grocery adds, multiple households, household photos (object storage), PWA install/offline cache, desktop sidebar
- **Minor:** merge duplicate inventory rows on grocery purchase; RN-web shadow*/pointerEvents deprecation warnings

## Known limitations
- Google sign-in requires user's Google OAuth client in Supabase; native OAuth needs a built app (Expo Go limitation)
- Inventory quantity deduction assumes recipe units match inventory units
