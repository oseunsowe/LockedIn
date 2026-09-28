# Landing v2 — launch checklist

Updated 2026-09-26. The local implementation includes static responsive sections, canonical product screenshots, the current official raster mark, Ethan placeholders, desktop product storytelling, reduced-motion behavior, waitlist states and first-party analytics.

## Phase 8 changes

- `marketing/tools/page.src.html` and generated `marketing/lockedinmissions/index.html`: email input and submit button start disabled, with a recovery message. A script failure cannot accidentally submit an email into the page URL.
- `marketing/lockedinmissions/js/waitlist.js`: enable the controls only after the submit handler is attached.
- `marketing/lockedinmissions/css/landing.css`: fix enlarged-text reflow in narrow grids, remove forced headline no-wrap, and allow long footer links to wrap. Adjust the narrow header to accommodate enlarged controls.
- `marketing/tools/qa-launch.mjs`: browser-selectable checks for internal anchors, heading count, desktop/mobile overflow, axe accessibility, mocked signup, 200% text-size document overflow, JavaScript-disabled content and failed-module recovery. Supports Chromium, Firefox and WebKit when installed.
- `marketing/tools/package.json`: `npm run qa:launch`.

## Next actions in order

1. **Approved legal destinations:** replace the current Claude-artifact Privacy and Terms links with approved durable pages. Their URLs have been requested from the user; no replacement legal text is invented here.
2. **Staging backend verification:** confirm that the existing waitlist and landing-analytics migrations are applied to the intended Supabase project. Do not blindly re-run migrations. Confirm deployed confirmation/unsubscribe functions and approved email configuration.
3. **Controlled email smoke check:** on staging, use an explicitly supplied test address to verify signup, delivery, confirmation, duplicate signup and unsubscribe. Current browser suites mock every backend call and do not establish live email delivery.
4. **Device/browser review:** check actual iOS Safari and Android Chrome, keyboard navigation, text enlargement, and reduced-motion scrolling. Playwright Firefox is useful cross-engine coverage; it does not substitute for physical Safari testing.
5. **Deployment review:** review only the intended website changes, verify the target document root and metadata domain, and prepare a deployable artifact. No bulk commit of the existing mixed working tree. Deploy only when authorized for a concrete target.
6. **Post-deploy checks:** verify HTTPS, local assets, canonical/social metadata, legal links, actual email flow, consent/opt-out behavior and field performance. Local LCP/CLS samples are not production Core Web Vitals.

Ethan artwork can replace its reserved slots later; the user explicitly approved placeholders for this iteration. A clean higher-resolution logo export is an asset-quality improvement, not a reason to replace the current correct mark.

## Commands

From `marketing/tools`, with Node and the corresponding Playwright browser installed:

```sh
npm run qa
npm run qa:journey
npm run qa:conversion
npm run qa:launch
QA_BROWSER=firefox npm run qa:launch
# WebKit is supported by the runner but has not been validated in this session.
QA_BROWSER=webkit npm run qa:launch
```

`QA_PORT` selects a separate local port when running engines concurrently. External API requests are mocked in the launch suite. No production data, email, database or deployment changes were made during this pass.

## Verified results

Chromium and Firefox both passed all four launch-check groups: desktop (1440px), narrow viewport (320px), JavaScript disabled and failed waitlist-module loading. Desktop/mobile groups checked anchors, one main heading, document overflow, zero axe violations, mocked signup and 200% text-size document overflow. Local asset-reference and JavaScript syntax checks passed. Text reflow failures found in the first runs were fixed and both engines were rerun successfully. These checks do not establish physical-device coverage or guarantee that every visual detail at enlarged text has been manually reviewed.

## Live read-only preflight — 2026-09-26

Used the website's public Supabase key only, with zero-row schema queries; no records were retrieved and no signup or email was sent.

| Check | Observed result | Meaning |
| --- | --- | --- |
| Waitlist attribution columns | HTTP 400, PostgreSQL `42703`: `utm_source` does not exist | Attribution migration is not available in the live API. Existing frontend compatibility fallback can submit basic signup fields, but campaign attribution will be lost. |
| Landing analytics table | HTTP 404, `PGRST205`: `landing_events` absent from schema cache | Analytics cannot currently be recorded by the new site. |
| Confirmation mail function, GET | HTTP 405, Method not allowed | Function is reachable and rejects the read-only method as expected. This does not verify mail credentials or delivery. |
| Homepage | HTTP 200; older “Become the person…” title | Public page differs from the new local page's metadata. |
| Confirmation and unsubscribe pages | HTTP 200 | Pages are reachable; token flows remain untested. |

**Immediate next action:** apply `supabase/migrations/20260925130000_landing_analytics.sql` to project `usqukqpgwexwjiglhpdj` through the existing migration process or Supabase SQL Editor. Review migration history before running; the CREATE TABLE statements are intentionally not safe for arbitrary repeat execution. Then repeat the zero-row schema checks. There is no connected Supabase database-management tool or installed Supabase/psql CLI available in this environment, so the migration was not applied here. Do not share service-role keys in chat to unblock this.

No local Privacy/Terms document was found: the app and older website both reference the same Claude artifact. Approved durable URLs are still required.

## Migration verification — 2026-09-27

After the user imported the migration, both zero-row schema queries returned HTTP 200: all requested waitlist attribution columns and the `landing_events` fields are now available through the public API. This clears the missing-schema blocker recorded above. It does not by itself verify insert policies or stored event attribution.

The confirmation function still responds to GET with the expected 405. Homepage, confirmation and unsubscribe pages return 200; the public homepage still has the older title. No signup, analytics event or email was created by verification.

Next: a controlled live signup and confirmation-mail test using an address explicitly supplied by the user. The test address has been requested. Inbox receipt and the confirmation-link result must then be checked; function reachability alone is not delivery verification.

## Deployment completed — 2026-09-27

The user supplied the existing SFTP configuration and authorized publication. Release `landing-v2-2026-09-27T03-53-17-161Z` is live at https://lockedinmission.app/. All 49 public release files matched over HTTPS; desktop/mobile smoke checks and preserved route checks passed. See `LANDING-V2-DEPLOYMENT.md` for the backup and verification record.
