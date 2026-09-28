# Landing v2 — canonical assets and product storytelling

Completed 2026-09-26, following approval of the website proposal and the request to continue.

## Delivered

Phase 4's canonical product assets were already integrated in the static page. The new phase 5 enhancement reuses those exact responsive pictures; no new product UI or character artwork was generated.

Wide desktop viewports now show one persistent phone for Discover → Commit → Focus, and another for Proof → Verified → Progress. Each phone changes its screen as the reader scrolls, including when scrolling backward. A short stage label and progress line identify the current chapter. Verification and progression use the established earned-gold color.

The static band heights and columns remain unchanged. There is no scroll locking or scroll interception. Replacement images load near the section, at low fetch priority, and must decode successfully before the inline visual phones are hidden. If decoding fails, the static layout remains available.

The enhancement requires width ≥1101px, height ≥700px and no reduced-motion preference. Mobile, tablet, short desktop windows, reduced-motion mode and JavaScript-disabled browsing retain the inline product screens. Changing the motion preference or viewport restores the appropriate layout immediately. The shared phone is hidden from assistive technology; original meaningful image descriptions remain in the document.

## Files

| File | Change and reason |
| --- | --- |
| `marketing/lockedinmissions/js/journey.js` | New progressive-enhancement module: image readiness, chapter selection, frame-throttled scroll handling and live preference/viewport fallback |
| `marketing/lockedinmissions/js/main.js` | Initialize the journey module once |
| `marketing/lockedinmissions/css/landing.css` | Shared sticky device, crossfading screens, chapter progress and gold verification state, limited to eligible desktop viewports |
| `marketing/tools/qa-journey.mjs` | New browser checks for actual scrolling and fallback behavior; all backend requests mocked |
| `marketing/tools/package.json` | Add `npm run qa:journey` |

## Validation

All 27 journey assertions passed in Chromium: forward/backward chapter selection across both sequences, decoded active images, device visibility within the viewport, zero axe violations in the enhanced state, live reduced-motion restoration/re-enabling, mobile and short-window fallbacks, no runtime errors, and failed-image fallback. Reviewed the captured Commit and Verified layouts.

Run from `marketing/tools` with a working Node/Playwright installation:

```sh
npm run qa:journey
```

The temporary Linux environment documented in `LANDING-V2-PHASE-3.md` was reused. Screenshots: `/tmp/lockedin-journey-qa/how-active.png` and `/tmp/lockedin-journey-qa/proof-active.png`.

## Remaining checks

No blocker remains for this local storytelling implementation. Safari/Firefox and physical-device scrolling still need validation. Production performance, live backend/email configuration and legal destinations remain the launch checks identified previously. Approved Ethan imagery and a higher-resolution brand export remain external asset deliverables.

No backend changes, dependency additions, commit, push or deployment were performed in this phase.
