# Landing page v2 — design and implementation proposal

Status: proposed for approval. Scope: marketing website, using current product screenshots and Ethan placeholders.

## Composition

Use the supplied reference's compact cinematic bands, near-black background, editorial headlines and dominant product phone. At 1440px, use a 1280px content container and 80px outer margins. Fine borders separate sections. Reserve violet for actions, cyan for intelligence and gold for earned progress.

| Section | Desktop composition | Content and asset |
| --- | --- | --- |
| Header | Slim horizontal bar, official mark left, section links center, early-access CTA right | Existing lock icon; Product, How It Works, Missions, Creator Series anchors |
| Hero | Approximately 45% copy / 55% product stage, 760–900px tall including header; large phone with a restrained angle and scene behind it | “You said you’d do it. Now prove it.” Current mission-board screenshot. Ethan scene placeholder. Early access and See How It Works CTAs |
| Discover | Copy left, product center, three short steps right | Hidden Intentions screenshot; explain user-selected screenshots, not passive activity surveillance |
| Commit | Copy left, phone center, mission metadata and scene slot right | Current mission-detail screen; actual photo/screenshot proof methods |
| Focus | Copy left, calm product stage right | Existing Focus screen. Describe the focus session; omit a functional app-blocking demonstration until native enforcement exists |
| Real life | Shallow cinematic band, copy readable over a dark foreground | Wide Ethan placeholder; “Missions happen in real life.” |
| Proof and verification | Copy left, verified phone center, progress context right | “Done? Prove it.” Verified screenshot, clearly illustrative XP matching the selected screen. Current supported submission methods |
| Progress | Compact continuation of the verification section | Existing level-up screen; levels, XP and consistency copy. No invented reliability score |
| Activity strip | Short introduction beside a horizontally scrollable card row | Run, Swim, Train, Work, Build, Read, Create, Date, Travel, Rest; labeled media placeholders |
| Creator / evolution | Copy left, broad earlier/later scene slots right | “Better is built daily.” Ethan series identified as coming soon |
| Early access | Form and copy left, environment placeholder right | “Be first in.” Preserve working email form and status elements |
| Footer | Official mark, tagline, section and legal links | “Progress lives here.” Durable legal URLs need confirmation before launch |

The visual target is the reference's hierarchy and layout. Current real screens replace conceptual screens; empty cinematic areas remain intentional placeholders until approved artwork arrives.

## Component structure and ownership

Keep the static architecture. Components below are reusable HTML/CSS patterns, not new React components.

```text
LandingPage
  Header / BrandMark
  Hero / ProductStage / EthanSlot
  ProductJourney
    DiscoverStage
    CommitStage
    FocusStage
  RealLifeBand / EthanSlot
  ProofAndProgress / ProductScreen / ProgressContext
  ActivityStrip / ActivityCard
  EthanEvolution / EthanSlot
  EarlyAccess / EmailCapture
  Footer / BrandMark
```

Shared patterns: Container, SectionEyebrow, DisplayHeading, Button, PhoneFrame, ProductScreen, MissionMetadata, EthanSlot and Reveal. Keep `page.src.html` as the editable page source and `index.html` as generated output. Continue using `lim-pic` expansion for responsive product assets; avoid a framework migration or separate template engine.

## Asset map

All site-relative paths below are within `marketing/lockedinmissions/`.

| Slot | Current source | Treatment |
| --- | --- | --- |
| BrandMark | `assets/icon.png` | Reuse actual raster lock mark in header/footer, with an accessible LockedIn label. Do not redraw or substitute a typed wordmark for the logo. Preserve source proportions |
| Hero | `assets/lockedin/ui/LIM-UI-002-mission-board-*` | AVIF/WebP 360/720 sources; eager load only hero-critical image |
| Discover | `assets/lockedin/ui/LIM-UI-005-intentions-*` | Lazy load; preserve complete readable screen |
| Commit | `assets/lockedin/ui/LIM-UI-003-mission-detail-*` | Lazy load |
| Focus | `assets/lockedin/ui/LIM-UI-004-focus-*` | Lazy load |
| Verified | `assets/lockedin/ui/LIM-UI-011-verified-*` | Lazy load; align surrounding XP copy with image |
| Progress | `assets/lockedin/ui/LIM-UI-012-level-up-*` | Lazy load |
| Ethan hero / real life / evolution | Reserved `assets/lockedin/ethan/animated/` | HTML/CSS slots now; approved responsive images later |
| Activities | Reserved `assets/lockedin/activities/` | Stable portrait aspect ratio, activity name visible without media |
| Social preview | `assets/lockedin/brand/og-image.png` | Update builder to reuse the real brand asset when visual implementation starts |

Placeholder slots use restrained dark surfaces and a small “Ethan Mercer · preview” label. Avoid displaying internal filenames, asset statuses or production instructions to visitors. Decorative scene slots are hidden from assistive technology; activity titles remain actual text. Reserve dimensions to avoid layout shifts when media is added.

## Token map

Retain existing production-derived colors and local fonts. Adjust layout/type tokens to fit the composition.

| Role | Proposed value |
| --- | --- |
| Background / surfaces | Existing `--lim-black`, `--lim-surface-01/02/03` |
| Action | Existing `--lim-violet` #6365f1 and `--lim-violet-bright` #8b52f6 |
| Earned / intelligence / success | Existing gold #d4af37, cyan #13bbd4, success #34d399 |
| Type | Outfit display, Inter body, JetBrains Mono for short system labels |
| Hero type | Desktop 96–112px; tablet 64–80px; mobile 52–64px, reducing further if needed at 320px to prevent clipping |
| Section type | Desktop 40–56px for compact bands; mobile 32–40px |
| Body | 17–20px, approximately 1.55 line height, max 48 characters per line |
| Content / gutters | 1280px maximum; desktop 64–80px, tablet 32px, mobile 20px |
| Section spacing | Desktop 72–104px; mobile 56–72px; media bands may be shallower |
| Controls | At least 44px high; clear focus outline; text plus icon where useful |
| Motion | Micro 160ms, state 200–300ms, reveal 600ms; existing ease-out curve |

Check contrast after composition changes; do not depend on a gradient or color alone to communicate a state.

## Responsive strategy

- **Desktop, 1024px and up:** editorial columns and large devices. Initial static version uses independent band compositions. Later storytelling can share a sticky device across Discover/Commit/Focus only if it preserves the approved visual density.
- **Tablet, 641–1023px:** two columns where legible; metadata moves below copy. Reduce device angle and scene layering. Keep navigation from wrapping into the hero.
- **Mobile, 640px and below:** headline → CTA → product screen → sequential story sections. Phone width approximately 80–90vw within the container. Remove perspective; never shrink a three-column desktop layout into mobile. Keep the early-access CTA visible in the header; use a labeled menu toggle for section links if they cannot fit.
- Activity strip supports touch scrolling and keyboard access without automatic motion. Forms stack when the email/button row becomes cramped. Test 320px, 390px, 820px and 1440px, plus text enlargement.

## Animation strategy

The static page must communicate the entire story before animation is enabled.

1. Hero: one entrance sequence; copy fades/translates slightly, phone rises about 24–30px and settles. No perpetual bounce or auto-playing audio.
2. Sections: once-only opacity/transform reveals. Content remains visible with JavaScript unavailable or initialization failure.
3. Product journey: progressive enhancement using IntersectionObserver and CSS sticky positioning on desktop. On mobile show the corresponding screen in each section. No scroll locking.
4. Verification: restrained gold reveal; any animated progression is clearly a product illustration, not a live user result. Do not invent values absent from the displayed asset.
5. Reduced motion: immediately visible sections, no perspective animation, no animated scrolling, no moving activity strip. Handle changes to the preference during a session.

Use existing CSS and native browser APIs first. No additional runtime animation kit is needed for this proposal. Keep motion setup in `motion.js`, analytics setup in its own initialization path, and call each once from `main.js`.

## Waitlist and analytics architecture

Preserve the existing form IDs and backend contract. Keep idle, focused, validating, submitting, success, duplicate, invalid and server-error feedback. Add a submit-in-flight guard; retain focus management, live feedback and the disabled submitting button. Check copy against the actual confirmation flow; remove the current contradictory “one email” promise if launch updates and confirmation are both sent.

Reuse existing attribution capture and Supabase event transport. Retain landing, CTA, section, creator, waitlist and scroll-depth events. One listener should own each interaction. Form payload includes current UTM attribution; backend migration and email delivery need deployment verification. Browser checks mock successful and failing responses so QA never signs anyone up or sends real email.

## Implementation order and files

| Step | Files | Purpose |
| --- | --- | --- |
| 1. Restore local QA runtime | Environment only | Make Node and browser tooling executable before claiming visual validation |
| 2. Static redesign | `marketing/tools/page.src.html`, generated `marketing/lockedinmissions/index.html`, `css/tokens.css`, `css/landing.css` | Reference composition, correct brand mark, placeholders, responsive sections |
| 3. Build entry point | `marketing/tools/package.json` | Add the documented page-generation script |
| 4. Asset integration | `marketing/tools/build-assets.mjs`, generated brand assets as needed | Preserve real UI and use actual logo in social preview |
| 5. Motion and listener cleanup | `js/main.js`, `js/motion.js`, `js/analytics.js` if needed | One initialization path, progressive enhancement, reduced motion |
| 6. Form regression checks | `js/waitlist.js`, `marketing/tools/qa.mjs` as needed | All form outcomes, no duplicate submission, meaningful failing QA status |

Review desktop/mobile screenshots before adding scroll storytelling. Then verify keyboard navigation, zoom, reduced motion, missing media, no-JavaScript content visibility, local asset responses and mocked waitlist outcomes. Run accessibility checks and measure local LCP/CLS; validate production performance separately rather than treating local timing as field evidence.

## Approval boundary and phase result

Created this proposal only; no website or app implementation changed during phase 2. Relevant testing skills are already installed. No additional asset generation or library installation is proposed.

The website handoff in `supabase/migrations/update.md`, phase 2, says: “Wait for approval before large structural changes.” Approval of this proposal authorizes the static responsive redesign and the scoped supporting changes above. Ethan artwork, a higher-resolution logo source and live backend verification can follow without preventing the static build.
