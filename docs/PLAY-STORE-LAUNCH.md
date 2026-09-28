# LockedIn — Google Play launch guide

Package: `com.lockedin.app` · Expo/EAS project: `@kimkemp/lockedin` · Build profile: `production` (App Bundle)

## 0. Do these two things BEFORE any user can install (security)

Production was tested as a normal signed-in user on 2026-09-28 and a critical hole was found: a user could
set their own XP / level / streak with one API call. The fix is written and pushed but must be applied:

1. **Run `supabase/migrations/20260928120000_lock_server_owned_columns.sql`** in the Supabase SQL editor
   (Dashboard → SQL Editor → New query → paste → Run). The GitHub integration does not apply migrations.
2. **Redeploy the edge functions** `verify-proof` (XP clamp) and `delete-account` (removes the profile picture):
   Dashboard → Edge Functions → each function → paste the file from `supabase/functions/<name>/index.ts` → Deploy.
   (Or `npx supabase login` then `npx supabase functions deploy verify-proof delete-account --project-ref usqukqpgwexwjiglhpdj`.)
3. Re-run `node supabase/scripts/create-review-account.mjs` (needs `SUPABASE_SECRET_KEY`) and re-run the probe to
   confirm `PATCH profiles {xp_total}` now returns 403.

Also rotate: the cPanel password (printed in a session on 2026-09-28) and consider rotating the Supabase secret key
(it lives in the untracked `supabase/supabase.md`).

## 1. The build

`npx eas-cli build --platform android --profile production` (already done from this machine; EAS holds the upload
keystore). Download the `.aab` from the build page and upload it to Play Console → Testing → Internal testing →
Create release. Each build auto-increments `versionCode`.

Play App Signing: accept it when creating the app. Then copy **App integrity → App signing key SHA-1** for Google
sign-in (section 5).

## 2. Store listing (copy — truthful to what ships)

- **App name:** LockedIn
- **Short description (80):** Turn goals into missions, prove you did them, and level up.
- **Full description:**
  LockedIn turns the things you keep putting off into missions you actually finish.
  Set a goal, pick a difficulty and a deadline, do the work, then submit proof — a photo, screenshot or file.
  AI checks your proof and tells you how confident it is. Verified missions earn XP, levels and streaks.
  • Daily command center: what's due today, your main quest and a live countdown
  • Screenshot Intelligence: finds goals hiding in the screenshots you already saved (analysed, never stored)
  • Focus Mode: a distraction-free timer with a commitment to yourself
  • Recovery Mode: miss a deadline and nothing turns red — you get a fresh start
  • Reminders you control: morning brief, deadlines, streak at risk, quiet hours
  Free to start. AI verification is advisory and can be wrong.
- **Category:** Productivity (alt: Lifestyle) · **Contact email:** hello@lockedinmission.app
- **Website:** https://lockedinmission.app · **Privacy policy:** https://lockedinmission.app/privacy.html
- **Graphics:** icon 512×512 (use `app/assets/icon.png`), feature graphic 1024×500, ≥2 phone screenshots
  (the real captures in `marketing/lockedinmissions/assets/lockedin/ui` are 1170×2532 originals in `assets/iPhone figma`).

## 3. App content

- **App access:** "All or some functionality is restricted" → provide the review login (email + password from
  `create-review-account.mjs`; do not commit it). Instructions: "Sign in with email and password on the first
  screen. The account is pre-populated with missions and progress."
- **Ads:** No. **Target audience:** 13+ (not directed to children). **News app:** No.
- **Content rating (IARC):** no violence, sexual content, gambling, drugs or user-to-user communication →
  expect Everyone / 3+. Answer "No" to user-generated content shared with others (content is private).
- **Data safety** (all encrypted in transit; users can request deletion at https://lockedinmission.app/delete-account.html):

  | Data type | Collected | Shared | Purpose |
  |---|---|---|---|
  | Email address | Yes | No | Account, support |
  | Name (display name) | Yes | No | App functionality |
  | Photos/videos (proof, avatar) | Yes, optional | No* | App functionality |
  | Files (proof) | Yes, optional | No* | App functionality |
  | App interactions (missions, XP, focus time) | Yes | No | App functionality |
  | Purchase history | Later (subscriptions) | No | App functionality |

  \*Proof images are sent to an AI service provider (Anthropic) to produce the verification. Sending data to a
  service provider that processes it on your behalf is not "sharing" under Play's definition.
  Not collected: location, contacts, audio, financial info, device/advertising IDs.
- **Permissions:** CAMERA (optional, only when the user taps the camera option), POST_NOTIFICATIONS (reminders the
  user turns on). Photo/media and storage permissions are deliberately blocked (system photo picker is used).
- **Account deletion:** in-app (Profile → Delete Account) and web URL above.

## 4. Test tracks

New personal developer accounts must run a closed test with at least 12 testers for 14 days before production
access; organisation accounts skip this. Start with **Internal testing** (up to 100 testers, instant) to validate
sign-up, mission → proof → verification, Focus Mode, notifications and account deletion on real devices.

## 5. Google sign-in (optional for v1; hidden until configured)

The Google button only appears when `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set. To enable: in Google Cloud create an
OAuth **Web** client (its ID goes in `eas.json` env) and an **Android** client for `com.lockedin.app` registered with
BOTH the EAS keystore SHA-1 (`eas credentials`) and the Play App Signing SHA-1. Then enable the Google provider in
Supabase Auth with the web client ID.

## 6. Before the first public release

- Payments are not live (RevenueCat + Play products, TODO §12.3). The paywall says so; consider hiding it until launch.
- Sentry/crash reporting is not installed (needs a DSN).
- Voice proof and app blocking are not built; nothing in the store copy claims them.
