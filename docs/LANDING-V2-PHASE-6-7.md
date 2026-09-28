# Landing v2 — motion and conversion hardening

Implemented 2026-09-26. Website scope only; existing logo, app screenshots and Ethan placeholders retained.

## Changes

| File | Change |
| --- | --- |
| `marketing/lockedinmissions/css/landing.css` | One-time earned-progress reveal; disabled by reduced-motion preference. Existing hero and shared-device motion retained. |
| `marketing/lockedinmissions/js/waitlist.js` | A 15-second deadline spans signup and compatibility retry. Timeout restores the button and provides retry guidance. `aria-busy` reflects submitting state. No automatic retry of an uncertain write. |
| `marketing/lockedinmissions/js/analytics.js` | Reject expired/future-dated attribution records, allow only known stored fields, and enforce database length limits on attribution and paths. |
| `marketing/lockedinmissions/js/motion.js` | Section views use a viewport visibility band, fixing tall mobile sections that cannot reach a 40% intersection ratio. |
| `marketing/tools/qa-conversion.mjs` | Browser regression coverage with all API responses mocked. |
| `marketing/tools/package.json` | Added `npm run qa:conversion`. |

## Conversion verification

Seven scenario groups passed in Chromium:

- First-touch UTM attribution survives navigation; CTA and conversion events emit once.
- Oversized cached attribution is bounded; unknown fields are discarded.
- Expired and future-dated attribution are replaced.
- Missing attribution columns trigger one compatibility retry using the existing signup fields.
- A real 15-second stalled-request deadline releases busy state; duplicate submit is blocked and manual retry succeeds.
- Tall mobile story sections emit their view event.
- Do Not Track suppresses analytics without preventing signup.

JavaScript syntax checks passed. No real signup, analytics row or email was sent. The temporary Linux Node/Chromium environment was restored after `/tmp` was cleared between sessions. No runtime dependency was added to the website.

## Remaining launch checks

Live Supabase migration status and actual email delivery have not been validated. Published legal destinations, Safari/Firefox and physical-device behavior, production Core Web Vitals and final Ethan media remain outstanding. Local browser checks do not certify those external conditions. No commit, push or deployment was performed.

## Responsive regression result

The existing Chromium QA suite passed at 320px, 390px, 820px and 1440px with no horizontal overflow, reported JavaScript/asset errors or axe violations. All nine existing menu/form assertions and the no-JavaScript content check passed. Reviewed the mobile screenshot. Results: `/tmp/lockedin-phase7-qa.json`; screenshots: `/tmp/lockedin-phase7-qa/`.
