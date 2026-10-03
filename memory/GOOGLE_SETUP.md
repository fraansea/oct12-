# Roomie — Google Sign-in & Supabase Settings Setup Guide

Your project: **qgenemhetpmfunphlrbe**
Supabase callback URL (you'll paste this into Google): 
`https://qgenemhetpmfunphlrbe.supabase.co/auth/v1/callback`
Your app's web URL: 
`https://f5f55a21-46dd-4094-b996-5340edcb014d.preview.emergentagent.com`

The app code is already set up (Supabase PKCE + code exchange). Only the steps below remain.

------------------------------------------------------------
## PART A — Google Cloud Console (create the OAuth client)
------------------------------------------------------------
1. Go to https://console.cloud.google.com → pick (or create) a project.
2. Left menu → "APIs & Services" → "OAuth consent screen".
   - User type: External → Create.
   - App name: Roomie. Add your email as support + developer contact. Save.
   - Under "Test users", add your own Google email (so you can log in while it's unpublished).
3. Left menu → "APIs & Services" → "Credentials" → "+ Create Credentials" → "OAuth client ID".
   - Application type: **Web application**.
   - Name: Roomie Web.
   - Under "Authorized redirect URIs" click "+ ADD URI" and paste EXACTLY:
     `https://qgenemhetpmfunphlrbe.supabase.co/auth/v1/callback`
   - Create. Copy the **Client ID** and **Client Secret** (you'll need them in Part B).

------------------------------------------------------------
## PART B — Supabase: enable Google
------------------------------------------------------------
1. Go to https://supabase.com/dashboard → open project `qgenemhetpmfunphlrbe`.
2. Left menu → "Authentication" → "Sign In / Providers" (a.k.a. Providers).
3. Find **Google** → toggle it ON.
4. Paste the **Client ID** and **Client Secret** from Part A.
5. Save.

------------------------------------------------------------
## PART C — Supabase: redirect URLs
------------------------------------------------------------
1. Authentication → "URL Configuration".
2. **Site URL**: `https://f5f55a21-46dd-4094-b996-5340edcb014d.preview.emergentagent.com`
3. Under **Redirect URLs** → "Add URL" for each of these:
   - `https://f5f55a21-46dd-4094-b996-5340edcb014d.preview.emergentagent.com/**`   (web preview)
   - `frontend://**`   (native build)
   - `exp://**`   (Expo Go, testing)
4. Save.

------------------------------------------------------------
## PART D — Supabase: let new users log in right away (email)
------------------------------------------------------------
Right now new email signups get "Email not confirmed" and can't log in.
1. Authentication → "Sign In / Providers" → **Email**.
2. Turn OFF "Confirm email".
3. Save. (Turn it back on later for production if you want verified emails.)

------------------------------------------------------------
## Notes
- Google sign-in works best in the **web preview** and in a real native build.
  In Expo Go the deep-link handoff can be flaky — that's an Expo Go limitation,
  not a code bug.
- After Parts A–C are done, tap "Continue with Google" in the app; you'll be
  sent to Google, then returned and logged straight into your household.
