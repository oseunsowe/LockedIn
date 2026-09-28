# Landing page v2 — phase 1 audit

Date: 2026-09-26. Scope: website only; audit and tooling preparation.

## Direction and scope

Read `task.md` for product truth and `supabase/migrations/update.md` for the website handoff. The latter's master prompt explicitly says “PHASE 1” / “Do not modify code yet” / “Begin with PHASE 1 only.” Its earlier phase list uses different numbering; this report follows the master prompt: audit, then design proposal, then implementation.

Inspected the supplied reference at `assets/iPhone figma/new landing page/LockedIn_ Progress Lives Here.png`. Match its composition, hierarchy, near-black surfaces, violet actions and restrained gold rewards. Keep current real app screenshots until the app redesign is ready. Keep Ethan Mercer as replaceable media placeholders. Preserve the actual brand mark rather than reproducing the reference's lettering.

## Existing architecture

| Area | Findings |
| --- | --- |
| Website framework | Static HTML, CSS and native JavaScript modules in `marketing/lockedinmissions/`. No React or animation framework required. |
| Routing | Anchor navigation within `index.html`; separate confirmation, unsubscribe, password-reset and admin pages. |
| Page source | `marketing/tools/page.src.html` is expanded by `build-page.mjs` into `index.html`. Future markup edits must update the source and regenerate the output. |
| Styling | Active page loads `css/tokens.css` and `css/landing.css`. Older `style.css` and `script.js` also exist; they are not the current landing entry points. |
| Fonts | Self-hosted variable Outfit for display, Inter for body, JetBrains Mono for labels. Existing tokens reference production app colors. |
| Reusable presentation | Container, headings, buttons, phone frames, screenshot pictures, journey steps, cards, badges, Ethan slots, activity cards and waitlist UI already exist as markup/CSS patterns. |
| Motion | CSS transitions/keyframes plus IntersectionObserver for reveals and sticky screen changes; reduced-motion styles and JavaScript handling exist. |
| Assets | Real-screen asset mapping in `build-assets.mjs`; 360/720-pixel AVIF and WebP variants; local fonts and social image. |
| Waitlist | Supabase REST insert, validation, honeypot, duplicate/network/server states and confirmation-email function call. This is existing code, not a verified live deployment. |
| Analytics | First-party Supabase events, section visibility, CTA and scroll tracking, first-touch UTM storage with a 30-day lifetime and Do Not Track handling. Migration exists; deployment has not been verified. |
| Deployment | Static directory with Apache `.htaccess` MIME, compression and caching rules. Metadata assumes `https://lockedinmission.app/`. Local Node server available; actual hosting configuration not verified. |
| App boundary | Separate Expo/React Native app with Expo Router. Website work does not require changing its navigation, data models or screens. |

## Reference comparison and implementation constraints

- **Hero:** reference has a large angled phone, strong left-aligned type and a cinematic environment behind it. Existing hero has the appropriate copy, real screen and an Ethan slot, but needs a composition pass.
- **Sections:** reference uses compact, edge-to-edge narrative bands. Existing design uses larger journey sections and sticky product stages. Reconcile density and image placement without losing legibility or the mobile sequence.
- **Brand:** header and footer currently render `Locked<span>In</span>` as text. The social-image builder also draws text. These do not meet the handoff's actual-logo requirement. `TODO.md` identifies the approved lock mark and documents the existing raster extraction; `marketing/lockedinmissions/assets/icon.png` contains that mark. Reuse the existing mark for now. A clean vector/transparent lockup remains a quality improvement, not a reason to invent a logo.
- **Ethan:** placeholder slots already exist. Preserve the intended hero, real-life and evolution media footprints; replace their media later without layout changes. Do not generate a new character in this phase.
- **Product truth:** the mockup's Health/GPS verification, reliability score and native distraction blocking must not be advertised as working capabilities without implementation evidence. The current TODO explicitly describes native enforcement as unbuilt. Use current supported proof and progression features.
- **Navigation:** omit unfinalized pricing, unsupported sign-in destinations and unavailable social links. A real video has not been supplied; the existing “See How It Works” section link is appropriate.

## Technical issues to resolve during implementation

1. `js/main.js` imports `js/motion.js` but repeats its header, reveal, journey and analytics listener setup. Consolidate initialization to prevent duplicate listeners and potentially duplicated CTA events. Some events already have once-only deduplication.
2. `build-page.mjs` documents `npm run page`, but `marketing/tools/package.json` has no `page` script. Add one when implementation starts and keep generated HTML aligned with its source.
3. Asset output names are stable, despite a caching comment calling them hashed. Future replacements must account for cached media/fonts.
4. Privacy and Terms links currently point to a Claude artifact. Replace with durable published legal destinations before launch.
5. Existing QA checks browser errors, overflow, axe violations and local LCP/CLS, but does not test all waitlist states, INP or real Safari/Firefox behavior. It reports violations without failing the process. A successful process exit alone would not establish a QA pass.
6. The working tree contains extensive pre-existing app, database and website changes. Keep subsequent edits scoped; no bulk cleanup, commit or deployment was performed.

## Tooling prepared

Installed the curated `playwright` and `screenshot` skills using the skill-installer helper. They are available on the next turn after installation. Existing marketing tooling already declares Playwright, axe, Sharp and local font packages, and its node_modules directory exists; dependency usability remains unverified.

No animation library was added. The existing CSS/IntersectionObserver approach supports the planned restrained motion. Introduce GSAP only if the approved scroll sequence needs timeline control beyond the current implementation. No Figma connector is needed to inspect the supplied local PNG.

## Validation and limits

Completed source inspection and visual inspection of the supplied reference and existing brand icon. Attempted `QA_OUT=/tmp/lockedin-phase1-qa npm run qa` from `marketing/tools`; it failed before tests started because the shell resolves Windows npm and Linux `node` is missing. Direct Windows `node.exe --version` also failed with a WSL socket error. No browser, accessibility or performance pass is claimed.

Before visual implementation QA, provide a working Linux Node runtime or repair Windows/WSL interoperability, then run the existing suite with backend requests blocked. Check desktop, tablet, mobile, keyboard access, reduced motion and all mocked waitlist outcomes. Confirm actual backend migration/email deployment separately.

## Phase result and next deliverable

- Created: this audit report, to preserve the findings and implementation constraints.
- Website/app code modified: none, as directed by phase 1.
- Skills installed: Playwright and screenshot.
- Remaining dependencies: working browser-test runtime; eventual approved Ethan assets and higher-quality logo export; live backend/deployment verification.
- Next: phase 2 component/asset/token map and responsive/motion proposal, followed by the static redesign. Use the existing static architecture, correct brand mark, current product screens and Ethan placeholders.
