# Landing v2 — static redesign delivered

Implemented the approved phase 2 proposal on 2026-09-26, using the current real application screens and replaceable Ethan media slots.

## Changes

| Files | Result |
| --- | --- |
| `marketing/tools/page.src.html`, generated `marketing/lockedinmissions/index.html` | Reference-led hero and compact narrative bands; canonical screens; official raster lock mark in header/footer; mobile menu; clean Ethan placeholders; current supported feature copy |
| `marketing/lockedinmissions/css/landing.css` | Editorial typography, angled desktop devices, responsive tablet/mobile compositions, media placeholders, keyboard focus and reduced-motion support; content visible without JavaScript |
| `marketing/lockedinmissions/js/main.js` | Accessible navigation disclosure, Escape dismissal and section-link closing |
| `marketing/lockedinmissions/js/motion.js` | Removed obsolete sticky-stage logic for the independent static bands; retained one initialization path for reveals and analytics |
| `marketing/lockedinmissions/js/waitlist.js` | Prevent repeated submissions while pending or complete; explicit success state; retained backend contract |
| `marketing/tools/package.json` | Added `npm run page` for generated HTML |
| `marketing/tools/build-assets.mjs`, `marketing/lockedinmissions/assets/lockedin/brand/og-image.png` | Social preview uses the official lock mark |
| `marketing/tools/qa.mjs` | Added 320px checks, local asset failure reporting, complete lazy-image captures, mocked waitlist/menu checks, no-JavaScript visibility and nonzero exit on failed assertions |

No app UI or database changes were needed. Existing fonts, production colors, canonical screenshot assets and Supabase form/analytics contracts remain in use. The earlier audit's duplicated entry-point code had already been removed when implementation began.

## Verification

Chromium checks at 320px, 390px, 820px and 1440px: no horizontal overflow, no reported page JavaScript errors or missing local responses, and zero axe violations. All nine menu/form checks passed: menu open, Escape close, invalid email, no invalid submission, duplicate, server error, network error, success and visible success panel. Content visibility without JavaScript passed.

Reviewed desktop, mobile and tablet screenshots. Adjusted the tablet breakpoint after visual review; the tablet composition uses stacked hero copy and product stage. Final local unthrottled performance sample: LCP 456ms, CLS 0.000026. These are local measurements, not production Core Web Vitals or an INP result.

QA backend requests were blocked or mocked; no real signup or email was sent. JavaScript syntax and generated-page whitespace checks passed.

## Tooling notes

The host's Windows npm could not run in WSL. A temporary Linux Node 22 runtime, Chromium, required shared libraries and a compatible Sharp package were placed under `/tmp`. System packages were not changed. Existing marketing Sharp failed to load under Linux, so the social asset was generated using the temporary compatible package and the updated builder's social-card logic. Existing product media was not regenerated.

Standard commands from `marketing/tools` on a working Node installation:

```sh
npm run page
npm run serve
npm run qa
```

This session's temporary QA environment:

```sh
LD_LIBRARY_PATH=/tmp/lockedin-browser-libs/usr/lib/x86_64-linux-gnu \
PLAYWRIGHT_BROWSERS_PATH=/tmp/lockedin-browsers \
QA_OUT=/tmp/lockedin-phase3-final \
/tmp/node-v22.16.0-linux-x64/bin/node qa.mjs
```

## Remaining scope

- Approved Ethan artwork can replace the reserved slots later. No character imagery was generated.
- The correct existing raster mark is used; a clean vector export would improve large-format fidelity.
- Static section composition and restrained entrances are delivered. Advanced sticky storytelling is not part of this static pass.
- Real Safari/Firefox/device QA, production performance, live Supabase migration/email validation and durable published legal destinations remain launch tasks.
- No commit, push or deployment was performed.

Preview through XAMPP: `http://localhost/LockedIn/marketing/lockedinmissions/` (requires the user's Apache server to be running). Local QA screenshots are in `/tmp/lockedin-phase3-final/`; the complete report is `/tmp/lockedin-phase3-results.json`.
