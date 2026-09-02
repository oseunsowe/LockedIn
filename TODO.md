# LockedIn — Road to MVP

> **"Become the person you promised yourself you would become."**
>
> This is the single execution plan for LockedIn from scaffold → App Store. Work top to bottom.
> Every phase has an exit gate; do not start the next phase until the gate is green.

**Status legend:** `[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked · `[-]` cut from MVP

**Last updated:** 2026-09-01 · **Target:** TestFlight beta in 10 weeks, App Store in 14

**Progress so far:** Phases 0–3 (foundation/tooling, design system + icons, app shell/navigation) are built and verified — `npm run verify` (typecheck + lint + format + **15 passing tests**) is green, GitHub Actions CI runs it on every push/PR, and a real `expo export` bundle succeeds. Phase 4's backend decision is made (Supabase) and scaffolded: 6 migrations + seed data (syntax-validated against Postgres's real parser, not run live), a typed client (`src/lib/supabase.ts`), and real auth wiring (Apple + email) integrated into the onboarding flow (`(onboarding)/auth.tsx`, `src/state/auth.tsx`). **Nothing has run against a live Supabase project or a real device/simulator** (neither available in this environment) — the app now crashes on launch until `app/.env.local` is filled in with a real project's credentials, which is intentional fail-fast, not a bug (see the Risk Register). See inline `[x]`/`[~]` status throughout for exactly what's verified vs. what still needs a real project + device to confirm.

---

## 0. Source of Truth & Resolved Decisions

Read this before touching any code. These decisions are made — do not relitigate them in PRs.

| Question | Decision | Authority |
|---|---|---|
| Brand colors | The **brand board** palette (Void/Obsidian/Electric/Violet/Iris/Gold/Pure) | `assets/fee4bba8-*.png` |
| Typography | **Outfit** (display) · **Inter** (body) · **JetBrains Mono** (data labels) | `assets/00985748-*.png` |
| Logo / app icon | Rounded-square lock mark, violet→iris gradient body, electric shackle, gold accent dot | `assets/6ba6504d-*.png`, `assets/73c5e6af-*.png` |
| Screen specs — onboarding | The **JPG mockups** are pixel authority | `assets/onboard_screen_*.JPG` |
| Screen specs — everything else | The **prompt spec**, since no mockups exist yet | `LockedIn.md` |
| Design system prose | Philosophy & component intent only — *not* token values | `docs/DESIGN-SYSTEM.md` |

### ⚠️ Conflicts resolved (do not copy the old values)

`docs/DESIGN-SYSTEM.md` predates the brand board and contains **superseded** tokens. The brand board wins:

| Token | ❌ Stale (`docs/DESIGN-SYSTEM.md`) | ✅ Authoritative (brand board) |
|---|---|---|
| Background | `#07090D` | `#050508` (Void) |
| Surface | `#11151C` | `#0F0F1E` (Obsidian) |
| Primary | `#635BFF` | `#6366F1` (Electric) |
| Gold | `#FFC857` | `#D4AF37` (Gold) |

- [ ] **P0** Add a "superseded — see TODO.md §0" banner to the top of `docs/DESIGN-SYSTEM.md`
- [ ] **P0** Delete the stale hex values from `docs/DESIGN-SYSTEM.md` so they can never be copy-pasted again

### Naming

The wordmark renders as **"Locked In"** (two words, `In` in Iris `#A78BFA`). The product/repo/bundle name is **LockedIn** (one word). Keep this consistent — it is currently inconsistent across docs.

---

## 1. MVP Scope — the honest cut list

The single biggest risk to this project is scope. `LockedIn.md` describes 16 screens and five AI systems. That is a v1.0, not an MVP.

### ✅ In scope for MVP

The **core loop must work end to end** before anything else ships:

> Onboard → see today's Main Quest → start it → submit proof → get AI-verified → earn XP → level up → come back tomorrow

1. Onboarding (4 steps, mockup-accurate)
2. Dashboard with Execution Score + Today's Missions
3. Mission board + mission creation (manual + template; AI-generate)
4. Active Mission Mode (timer + focus)
5. Proof submission (camera, screenshot, voice)
6. AI verification with confidence score
7. XP / levels / streaks / achievements
8. Progress profile
9. Screenshot Intelligence — **the differentiator, do not cut**
10. Paywall + subscriptions

### `[-]` Explicitly cut from MVP — revisit post-launch

- `[-]` **AI Coach voice-first screen** (Screen 14) — the single most expensive screen to build well. Ship a read-only "AI Insights" card feed on the dashboard instead; the mic comes in v1.1.
- `[-]` **Avatar progression artwork** (5 illustrated tier states × 8 classes = 40 assets). MVP uses the **class icon + tier ring color** treatment already proven in `onboard_screen_0/2/3.JPG`.
- `[-]` **Connected-app proof** (GitHub activity, etc.) — OAuth per provider is a multi-week tax. Manual proof only.
- `[-]` **Boss Missions** category — keep Main Quest / Side / Daily only.
- `[-]` **Social / friends / leaderboards** — not mentioned in spec, and it doubles the backend and moderation surface. Resist.
- `[-]` **Android launch.** Build cross-platform, but **launch iOS-only**. Halves QA and store surface. The design language is explicitly iOS-first.

- [ ] **P0** Get sign-off from the product owner on this cut list before Phase 1. Everything below assumes it.

---

## Phase 0 — Foundation & Tooling
*Gate: `npm run verify` passes clean on a fresh clone, app boots on device.*

### 0.1 Repo hygiene
- [ ] **P0** Add root `CLAUDE.md` (run `/init`) — capture brand tokens, folder conventions, "never hardcode hex" rule
- [x] **P0** `.nvmrc` pinned to Node 22.13+ (Expo SDK 57 minimum)
- [x] **P1** Root `README.md` — update the "Status: scaffolding" line as phases land
- [ ] **P1** PR template + `CODEOWNERS`
- [ ] **P2** Conventional commits + `commitlint`

### 0.2 App config
- [x] **P0** `name` → `LockedIn`, `slug` → `lockedin`, `scheme` → `lockedin`
- [x] **P0** `userInterfaceStyle` → **`dark`**
- [x] **P0** `ios.bundleIdentifier` → `com.lockedin.app`, `android.package` → `com.lockedin.app`
- [x] **P0** `backgroundColor` → `#050508` everywhere (root, iOS, Android, splash, web)
- [x] **P0** Android `adaptiveIcon.backgroundColor` → `#0F0F1E`
- [x] **P1** `ios.infoPlist` usage strings — camera, mic, photo library
- [x] **P1** `newArchEnabled: true`, `orientation: portrait` — `expo-updates` config still open (needs an EAS project)

### 0.3 Toolchain
- [x] **P0** TypeScript `strict: true` + `noUncheckedIndexedAccess`
- [x] **P0** ESLint (`eslint-config-expo`, flat config) + Prettier (`eslint-config-prettier` wired in to avoid rule conflicts)
- [x] **P0** `npm run verify` = `typecheck && lint && format:check && test --ci` — passes clean; also smoke-tested with `expo export` (real Metro/babel bundle, 3582 modules, catches what `tsc` can't)
- [x] **P1** Jest + `@testing-library/react-native` — real gaps found only by *running* it, not by reading docs: `jest-expo`'s peer `@react-native/jest-preset` had to be pinned to the **exact** installed `react-native` patch version (0.87.1 vs. our 0.86.3 caused a hard failure), `@types/jest` needed an explicit `"types": ["jest"]` in tsconfig (auto-inclusion doesn't reliably fire under `moduleResolution: "bundler"`), and `@testing-library/react-native`'s peer is now a package literally named `test-renderer` (React 19's replacement for the deprecated `react-test-renderer`) — none of that is guessable from the current official docs, which are already stale on this point. 17 tests passing across 4 suites: WCAG contrast math (with a real regression test asserting every `campaigns.ts` accent clears 3:1), `withAlpha`, and the onboarding-state stub (including a genuine "renderHook is `async function`, so a synchronous render throw becomes a rejected promise" behavior, confirmed by first getting it wrong from a bad test — an un-awaited `act()` — and re-deriving the correct behavior from a clean run, not by guessing twice).
- [x] **P1** GitHub Actions CI (`.github/workflows/verify.yml`) running `npm ci --legacy-peer-deps && npm run verify` on push/PR. The `--legacy-peer-deps` flag is required and non-obvious: `npm ci` alone resolves a *different* dependency tree than what's in the committed lockfile (missing `react-dom` and five other packages) because the lockfile was generated with the flag — confirmed by actually running plain `npm ci` clean-room and watching it fail before fixing the workflow. The whole job was clean-room verified locally (`rm -rf node_modules && npm ci --legacy-peer-deps && npm run verify`) before being written, not assumed to work from the YAML alone.
- [ ] **P2** Maestro or Detox for the one E2E test that matters: the core loop

### 0.4 Dependencies
> **Always install with `npx expo install <pkg>`**, never bare `npm install`. Expo resolves the version matched to SDK 57 — this is the #1 source of native crashes.

- [x] **P0** Navigation: `expo-router` (+ `expo-linking`, `react-native-screens` — required at runtime but not auto-installed by `expo install expo-router`; found via an `expo export` smoke test, not by inspection)
- [x] **P0** Motion: `react-native-reanimated` (4.5.1) + `react-native-worklets` (0.10.1) + `react-native-gesture-handler` (2.32)
- [x] **P0** Visual: `expo-linear-gradient`, `expo-blur`, `expo-image`, `react-native-svg`
- [x] **P0** Icons: `lucide-react-native` (see §2.3)
- [x] **P0** Type: `expo-font`, `@expo-google-fonts/outfit`, `@expo-google-fonts/inter`, `@expo-google-fonts/jetbrains-mono`
- [x] **P0** System: `expo-splash-screen`, `expo-haptics`, `expo-secure-store`, `react-native-safe-area-context`
- [x] **P1** `@react-native-community/netinfo` — pulled forward from Phase 3's offline banner, not originally listed here
- [ ] **P1** Capture: `expo-camera`, `expo-image-picker`, `expo-media-library`, `expo-audio`
- [ ] **P1** Data: `@tanstack/react-query`, `zustand`, `expo-sqlite`
- [ ] **P1** Services: `expo-notifications`, `expo-auth-session`, `expo-apple-authentication`
- [ ] **P2** `expo-dev-client`, `expo-updates`

> **Note for whoever runs `npx expo install` next:** it sometimes drops the package into `dependencies` even for pure build tooling (`babel-preset-expo` landed there). Check `package.json` after every install — build-only tools belong in `devDependencies`.

### 0.5 Native builds
- [ ] **P0** EAS project init + `eas.json` (development / preview / production profiles)
- [ ] **P0** Dev client build on a **real iPhone** — Expo Go cannot host `expo-camera`/`expo-audio` reliably. Do this in week 1, not week 8.
- [ ] **P1** Apple Developer Program enrollment + App Store Connect app record *(long lead time — start now)*

---

## Phase 1 — Design System in Code
*Gate: a screen can be built without a single raw hex value or magic number.*

**Location:** `app/src/theme/`

### 1.1 Color tokens (`theme/colors.ts`)
Verbatim from the brand board — these are the only hex literals allowed in the codebase:

```ts
export const palette = {
  void:     '#050508',  // app background
  obsidian: '#0F0F1E',  // card surface
  electric: '#6366F1',  // primary action, AI/intelligence
  violet:   '#8B5CF6',  // progression, XP
  iris:     '#A78BFA',  // accent, wordmark "In"
  gold:     '#D4AF37',  // achievement, elite tier
  pure:     '#FFFFFF',
} as const;
```

- [x] **P0** Semantic layer on top — never let a component import `palette` directly:
  `bg.canvas` · `bg.surface` · `bg.elevated` · `text.primary/secondary/tertiary` · `action.primary` · `state.success/danger/warning` · `border.subtle/strong`
- [~] **P0** Missing from the brand board, needed by the spec — define and get design sign-off:
  - `state.success` / `state.danger` / `state.warning` — coded with plausible placeholder hexes (`colors.ts`'s `unapproved` block, clearly named and commented) so nothing blocks on them. **Still needs real design sign-off before ship** — swap the values, not the token names.
- [x] **P0** **Gradients** — the product's signature. Codify, don't re-derive per screen:
  - `gradient.xp` — Electric → Violet (progression only; the "Start My Journey" button and XP rings)
  - `gradient.elite` — Gold, for tier-3 rings
  - `gradient.headline` — Violet → Iris → Gold, for the two-tone display headline
- [x] **P1** Alpha ramp for glassmorphism (`semantic.glass.fill4/fill8/border12` in `colors.ts`)

### 1.2 Campaign accent colors (`theme/campaigns.ts`)
`onboard_screen_7/8.JPG` gives each goal campaign its own accent — card border, icon tile, progress bar and check all recolor on selection. This is a **categorical palette** and must be defined once:

| Campaign | Accent | Campaign | Accent |
|---|---|---|---|
| Career Growth | Electric blue | Increase Income | Green |
| Build a Business | Gold | Create Content | Pink |
| Learn a Skill | Cyan | Improve Health | Red |
| Improve Fitness | Orange | Personal Growth | Violet |

- [x] **P0** Sample the exact hexes from `onboard_screen_7.JPG` / `onboard_screen_8.JPG` — pixel-sampled with ImageMagick off-center within each check-circle fill (avoiding the white checkmark glyph, which was pulling early samples toward white), not eyeballed. Values are in `campaigns.ts`.
- [x] **P0** Verify each accent hits **4.5:1** against Obsidian — computed via WCAG relative-luminance formula, now a real reusable module (`theme/contrast.ts`: `relativeLuminance`/`contrastRatio`/`wcagAA`) with a regression test (`__tests__/campaigns.test.ts`) rather than a one-off calculation, so the claim can't silently go stale. 6 of 8 pass 4.5:1; **Improve Health (4.47:1) and Personal Growth (4.43:1)** land just under — both still clear the 3:1 non-text minimum, so they're fine for icon tint/borders/progress fill but must not be used for body-size label text. (The "pink and cyan" guessed as likely failures above were actually fine — pink hit 4.99:1, cyan 7.51:1; red and violet were the real failures.)

### 1.3 Typography (`theme/type.ts`)
- [x] **P0** Load Outfit / Inter / JetBrains Mono; hold splash until fonts resolve
- [x] **P0** Scale — `display`/`displayLarge`, `title`, `body`/`bodyMedium`, `caption`, `data` (JetBrains Mono, +8% letter-spacing, uppercase)
- [x] **P0** **Two-tone headline component** — `<DisplayHeading>` in `src/components/DisplayHeading.tsx`. Ships the iris tone as a flat color for line 2 rather than a true masked SVG gradient (that needs extra native cost RN text can't do natively) — matches the brand board closely at body/title sizes; revisit with a masked gradient if a later pass wants the full violet→iris→gold sweep on the display-large hero.
- [ ] **P1** Mono is *only* for data. Enforce in review.
- [ ] **P1** Respect `allowFontScaling` up to 200% without breaking mission cards

### 1.4 Spacing, radius, elevation
- [x] **P0** 4pt spacing scale; radius scale (`spacing.ts`)
- [x] **P0** **Glow** utility — `theme/glow.ts`. Built on RN 0.86's real (non-`experimental_`) cross-platform `boxShadow` style prop, which needs New Architecture (already on via `newArchEnabled` in app.json) — this is the actual modern answer to the iOS-shadow/Android-elevation split the TODO flagged, not a workaround. Legacy `shadowColor`/`elevation` props layered in underneath as a fallback for anything that doesn't yet honor `boxShadow`; unrecognized style keys are silently ignored on native so this costs nothing when unneeded. Wired into the onboarding CTA buttons as the first real usage.
- [x] **P1** Glass card recipe — `TabBarBackground` in `TabBar.tsx` (`BlurView` + translucent fill + hairline top border). Not yet extracted into a general-purpose reusable card component; only exists inline on the tab bar so far.

### 1.5 Motion (`theme/motion.ts`)
- [x] **P0** Duration + easing tokens (`instant 120` / `quick 220` / `smooth 400` / `celebrate 800`)
- [x] **P0** Spring presets for card press, ring fill, XP count-up, celebrate
- [x] **P0** **Honor `prefers-reduced-motion`** — `useReducedMotion()` hook wraps `AccessibilityInfo`, live-updating. Wired into the token layer now; each animation still needs to actually check it when built.
- [x] **P1** Haptic pattern map — `motion.ts`'s `hapticEvent` map + `haptics.ts`'s `fireHaptic()`, so screens call `fireHaptic('missionComplete')` and never touch `expo-haptics` directly

---

## Phase 2 — Icon System
*Gate: zero emoji in shipped UI.*

### 2.1 Pack selection — **Lucide**

The mockups already use Lucide. `onboard_screen_4.JPG` shows `code`, `star`, `sun`, `graduation-cap`, `person-standing`, `briefcase`, `zap`, `pen-line`; `onboard_screen_5/6.JPG` shows `activity`, `gem`, `clock`, `dumbbell`, `trending-up`, `play`, `heart`, `sun`. These are Lucide glyphs at ~1.5px stroke.

- [x] **P0** Adopt **`lucide-react-native`** as the single icon source.
- [x] **P0** `[-]` **Remove every emoji from the spec.** All 33 semantic glyphs mapped and verified to exist in the installed package (checked file-by-file against `node_modules/lucide-react-native` — multi-word names like `chart-no-axes-column`, `circle-user`, `git-branch`, `badge-check`, `person-standing`, `graduation-cap`, `trending-up`, `pen-line`, `rotate-ccw` were confirmed against the package's actual exports, not guessed). Registry lives in `src/theme/icons.tsx`; the spec docs themselves are left as historical reference, not edited.
- [ ] **P1** Secondary pack for filled/duotone states: **Phosphor** — not added; revisit only if the tab bar genuinely needs a fill state Lucide can't do.
- [ ] **P1** `expo-symbols` (SF Symbols) for iOS-native affordances *only*

### 2.2 Icon component contract
- [x] **P0** `<Icon name size color strokeWidth />` wrapper (`src/theme/icons.tsx`)
- [x] **P0** Default `strokeWidth={1.5}`
- [x] **P0** `<IconTile>` component — rounded square, tinted accent fill (14% alpha via a small `withAlpha` helper), accent-colored glyph

### 2.3 Semantic icon registry (`theme/icons.ts`)
One map, referenced everywhere. Never `<Zap />` inline in a screen.

| Domain | Semantic name → Lucide glyph |
|---|---|
| **Nav** | home → `house` · missions → `swords` · progress → `chart-no-axes-column` · ai → `sparkles` · profile → `circle-user` |
| **Classes** | Developer → `code` · Founder → `star` · Creator → `sun` · Student → `graduation-cap` · Athlete → `person-standing` · Professional → `briefcase` · Entrepreneur → `zap` · Designer → `pen-line` |
| **Campaigns** | Career → `activity` · Business → `gem` · Skill → `clock` · Fitness → `dumbbell` · Income → `trending-up` · Content → `play` · Health → `heart` · Growth → `sun` |
| **Proof** | camera → `camera` · screenshot → `image` · voice → `mic` · file → `paperclip` · link → `link` |
| **Mission** | mainQuest → `flame` · side → `git-branch` · daily → `repeat` · timer → `timer` · difficulty → `signal` · xp → `zap` |
| **Status** | verified → `badge-check` · pending → `loader` · failed → `rotate-ccw` *(recovery, not `x`)* · streak → `flame` · locked → `lock` |

- [x] **P0** Build the registry with a TS type so an unknown name is a **compile error** — `IconName = keyof typeof iconRegistry`, and the registry itself is typed `satisfies Record<string, LucideIcon>`
- [ ] **P1** Achievement badges are *not* icons — they are custom illustrated SVGs (§8.4)

### 2.4 Brand assets — the app icon is fixed, but from a raster source, not vector
`app/assets/icon.png` was the stock Expo "A" logo. **Fixed** — replaced across the whole asset set. Important caveat: there is no vector (SVG/Figma) source for the lock mark anywhere in the repo, only PNG mockup screenshots. Everything below was produced by pixel-extracting the mark from the largest clean instance found (`assets/e93c6bb2-*.png`, a ~272px tile) and upscaling — **it is a real, correctly-colored, correctly-shaped icon, visibly better than the stock default, but soft/not pixel-crisp at full 1024px zoom.** Treat as a placeholder that unblocks everything else; get a vector re-export before App Store submission.

- [-] **P0** Export the lock mark from the brand board as SVG → master — **no vector source exists in the repo.** Extracted from the highest-resolution raster instance instead (see caveat above). Someone with the original Figma file should re-export properly.
- [x] **P0** `icon.png` @ 1024×1024, no alpha. *(Corners: the source tile has its own rounded corners baked in, since it's a raster crop, not a vector shape on a square canvas — iOS re-masks on top of that, which is harmless since the tile's own corner fill is dark and blends with the mask, but isn't the clean "square in, OS rounds it" pipeline you'd get from a vector source.)*
- [x] **P0** `splash-icon.png` — mark on transparent padding (Android-safe-zone proportions), composited by `expo-splash-screen`'s plugin onto `#050508`
- [x] **P0** Android adaptive: `foreground` (transparent-padded mark) + `background` (solid `#0F0F1E`) + `monochrome`. The monochrome layer is the one piece done at real quality regardless of the raster-source caveat — built from a **luminance threshold** (padlock is bright, tile corners are dark), verified as a clean single-color silhouette, not a filled square. Confirmed it recolors correctly under an arbitrary Android theme tint.
- [x] **P0** `favicon.png`
- [ ] **P1** Verify legibility at **20px** — not re-checked for our specific generated raster (the brand board's own 20px proof is for the designer's original, not necessarily identical post-extraction/upscale)
- [ ] **P1** Wordmark SVG (`Locked` white + `In` iris) — not built; same "no vector source" blocker as the mark
- [ ] **P2** App Store marketing icon + screenshot frames

---

## Phase 3 — App Shell & Navigation
*Gate: every route reachable, deep links work, no layout shift on cold start.*

- [x] **P0** `expo-router` file structure — routes exist and are wired end to end. Screens are functional stubs (real navigation, real theme tokens, real `campaigns.ts`/icon-registry data on the onboarding class/goal pickers), **not** pixel-matched to the mockups (no ring animation, particles, floating chips) — that's still Phase 5/6/7+:
  ```
  app/
    _layout.tsx              # DONE — fonts, splash gate, OnboardingProvider, root Stack.Protected gate, ErrorBoundary export
    design-preview.tsx       # DONE — the old root index.tsx, relocated (see routing note below)
    (onboarding)/
      _layout.tsx            # DONE — plain Stack
      index.tsx              # DONE (functional stub) — Welcome
      identity.tsx            # DONE (functional stub) — single-select class picker, real icon registry data
      goals.tsx               # DONE (functional stub) — multi-select campaign picker, real campaigns.ts data + accent recoloring
      generating.tsx           # DONE (functional stub) — completes onboarding, hands off to (app)
    (app)/
      _layout.tsx            # DONE — expo-router/ui headless Tabs + custom TabBar + OfflineBanner
      index.tsx / missions.tsx / progress.tsx / insights.tsx / profile.tsx   # DONE as labeled stubs (StubScreen) — real Phase 6/7/9/11 content not built
    (modals)/
      _layout.tsx            # DONE — Stack, presentation: modal
      proof.tsx / verification.tsx / level-up.tsx / paywall.tsx             # DONE as labeled stubs (ModalStub)
  ```
  **Routing note:** `(app)/index.tsx` and a literal root `app/index.tsx` both resolve to `/` (route groups are invisible in the URL) — they collided. Fixed by moving the old root index (the design-system preview) to `design-preview.tsx` and letting the root layout's `Stack.Protected` guards own `/` instead of a file. `hasOnboarded` lives in a small in-memory-only context (`src/state/onboarding.tsx`) — every cold start currently re-enters onboarding; that's intentional until Phase 4 provides real persisted state, not a bug.
  Verified via a real `expo export --platform ios` bundle (3582 modules, no duplicate-route or resolution errors — Metro's route analysis would throw on a real path conflict, which is how the collision above was actually caught). **Not verified on a real device/simulator** — whether `Stack.Protected` actually swaps screens at runtime when the guard flips, and whether `TabTrigger asChild` actually delivers `isFocused` into `TabButton` via the Radix `Slot` prop-merge, is confirmed against the shipped `.d.ts`/`.js` source, not confirmed by tapping through the app. Do this first thing once a dev client build exists (§0.5).
- [x] **P0** Custom tab bar — `src/components/TabBar.tsx`. Built on `expo-router/ui`'s headless `Tabs`/`TabList`/`TabTrigger`/`TabSlot`, **not** a React Navigation bottom-tabs wrapper — SDK 57 removed `@react-navigation/bottom-tabs` from the dependency tree entirely, confirmed by checking `node_modules` directly rather than assuming (see AGENTS.md's "Expo HAS CHANGED" warning — it was right). A `tabBarIcon`/`tabBarBackground`-style screenOptions API genuinely no longer exists for a fully custom bar. Glass background via `expo-blur`; gradient/dot active indicator, not yet the full mockup gradient treatment — good enough for a first pass, revisit in Phase 5 polish.
- [x] **P0** Splash → auth-state → route gate. `Stack.Protected` (SDK 57's replacement for a manual `<Redirect>` gate) driven by the onboarding stub context. Real auth state is Phase 4.
- [x] **P0** Safe-area handling — `SafeAreaProvider` in the root layout, `useSafeAreaInsets()` used throughout
- [x] **P1** Deep links — no extra code needed; `scheme: "lockedin"` (app.json) + expo-router's file-based routing handle this inherently. Not manually tested with a real deep link on device.
- [x] **P1** Error boundary — `ErrorBoundary` export from root `_layout.tsx` (the `{error, retry}` contract expo-router looks for)
- [x] **P1** Offline banner — `src/components/OfflineBanner.tsx`, `@react-native-community/netinfo`, mounted once in `(app)/_layout.tsx`
- [ ] **P2** Shared-element transition: mission card → active mission

---

## Phase 4 — Data Layer & Backend
*Gate: app works offline; a killed app mid-mission loses nothing.*

### 4.1 Decide the backend — **DECIDED: Supabase**
- [x] **P0** **Choose:** Supabase — Postgres fits the genuinely relational schema below (real joins/aggregations over `xp_events`, `missions`, `campaigns`; Firestore would make that awkward and expensive), plus RLS, Storage, and Edge Functions cover every other requirement in one platform.
- [x] **P0** Whatever wins, it must provide: email + **Sign in with Apple**, Postgres/document store, blob storage for proof media, and a **server-side function runtime**. All four covered by Supabase (Auth, Postgres, Storage, Edge Functions).
- [x] **Live project exists and is verified.** Project `lockedin` created; schema applied via the Supabase GitHub integration (migrations deploy automatically on merge to `master`); `app/.env.local` filled in with the real URL + publishable key. Confirmed by directly querying the live project (not assumed from the dashboard UI): all 9 tables from the migrations exist and are reachable under RLS, and the 3 seeded achievement rows are present (seed.sql isn't auto-applied by the GitHub integration — deliberately, since silently seeding production on every merge would be a bad default — so it was run once by hand via the SQL Editor). Apple's OAuth provider in the Supabase dashboard is still unconfigured (§5.5).

### 4.2 Schema
- [x] **P0** `supabase/migrations/` (6 files) + `supabase/seed.sql` — real Postgres DDL, not the loose table list originally sketched here. One meaningful change from the original plan: no separate `users` table — Supabase Auth already owns `auth.users`; `profiles` (with `identity_class`, `level`, `xp_total`, `streak_count`, `execution_score`, `onboarding_completed_at`) has a 1:1 FK to it instead, the standard Supabase pattern. `campaigns` became a Postgres enum (`campaign_key`) since the catalog itself — label/accent/icon — is static app config already living in `theme/campaigns.ts`, not user data; only `user_campaigns` (which ones a user picked) is a real table.
  Every table has RLS enabled. Three security decisions worth flagging explicitly: **no insert policy** on `verifications`, `user_achievements`, or `xp_events` for the authenticated role — these are written only by service_role (an Edge Function / webhook), matching §8.1's "server-side proxy only" and §9's "server-evaluated rules," so a compromised client literally cannot self-award XP or fake a verification. `profiles` rows are created only by an `on_auth_user_created` trigger (no client insert), removing a race window where a client could read a profile before it exists.
  Not run against a live database — no Docker/Postgres in this environment. Instead: every migration's **syntax** was validated against `libpg-query` (Postgres's actual C parser, via the npm binding, not a generic SQL linter) — all 49 statements across 6 files parse clean. That catches typos and malformed DDL; it does **not** catch a live-schema-only failure (e.g. a permissions issue applying a trigger to `auth.users`, which needs Supabase's specific migration-runner privileges to verify). Confirm with a real `supabase db push` before trusting this schema in production.
- [x] **P0** `xp_events` as an **append-only ledger** — `20260901000005_xp_ledger.sql`. No insert policy for clients (server-only writes); a trigger (`apply_xp_event`) maintains `profiles.xp_total` as a transactionally-updated cache, always re-derivable by summing the ledger if it's ever suspected to have drifted. Deliberately did **not** invent XP-curve/level-threshold numbers to fill in `profiles.level` — that's real game-design work Phase 9 hasn't done yet; inventing plausible-looking numbers now would be worse than leaving it a plain column.
- [x] **P1** Row-level security from day one — every table, not bolted on later.
- [ ] **P1** Timezone-aware "day" boundary for streaks — not addressed; streaks/`streak_count` logic doesn't exist yet (that's Phase 9), only the column.

> **Key naming:** use Supabase's new **publishable key** (`sb_publishable_...`), not the legacy anon key — confirmed current as of this session: legacy anon/service_role keys are being retired industry-wide in late 2026, and a project started now should use the new key model from day one. `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `app/.env.example` reflects this.

### 4.3 Client state
- [ ] **P0** React Query for server state, Zustand for ephemeral UI state (active timer, in-progress mission draft) — not yet added; only auth/onboarding-draft state exists so far (`src/state/auth.tsx`, `src/state/onboardingDraft.tsx`), both plain React Context since neither needed a heavier state library.
- [ ] **P0** SQLite offline cache + optimistic mutations with a sync queue. **Note:** `expo-sqlite` is now already a dependency (see below) — pulled forward for a different reason (session storage), so this item is partially unblocked, but the actual offline cache/sync-queue logic is still unbuilt.
- [ ] **P0** **Active mission timer must survive app termination.** Still unbuilt — no mission timer exists yet (Phase 7).
- [x] **P1** ~~`expo-secure-store` for tokens~~ — **changed after investigation.** Supabase's official current guidance (docs.expo.dev/guides/using-supabase, checked directly rather than assumed) uses `expo-sqlite`'s `localStorage` polyfill instead, and for good reason: `expo-secure-store` is backed by the iOS Keychain, whose items are capped around 2KB — smaller than a Supabase session (JWT + refresh token + metadata). SQLite has no such limit, avoiding the need for a custom chunked-encryption storage adapter (a real pattern some tutorials use, and real additional code to get wrong) just to work around it. `expo-secure-store` stays installed for other genuinely-small, genuinely-sensitive singular values if one comes up later — it's just not the right tool for bulk session storage. See `src/lib/supabase.ts`'s top comment.

---

## Phase 5 — Onboarding
*Gate: side-by-side pixel match against the four mockups on a real device.*

Four steps, mockup-authoritative. Progress bar reads `STEP n OF 4`.

**Note:** Phase 3 already built functional (not pixel-matched) versions of all 4 steps plus a 5th
auth screen, to get real navigation and real Supabase wiring in place early — see the route table
in Phase 3. That work is reflected in the `[~]` marks below: single-select/multi-select behavior,
accent recoloring, and CTA state-morphing are real; animation, glow, haptics, and the sticky
summary header are not.

### 5.1 Welcome — `onboard_screen_0/1/2/3.JPG`
- [ ] **P0** Hero: animated XP ring with lock mark at center, `LVL nn` in mono below
- [ ] **P0** **Tier ring states** — the ring color *is* the progression story. Recruit = muted steel, Builder = electric/violet, Elite = gold. Ring arc length + glow scale with tier.
- [ ] **P0** Floating XP chips (`+500 XP`, `+250 XP`, `+800 XP`, `LVL UP`) drifting with parallax; particle field behind
- [ ] **P0** Two-tone headline + subcopy
- [ ] **P0** Primary CTA "Start My Journey →" — full-width, Electric→Violet gradient, glow
- [ ] **P0** Secondary pair: "Import Screenshots" (`image`) / "Speak My Goals" (`mic`) — dark glass pills
- [ ] **P1** The three entry paths must actually diverge: Start → step 2; Import → Screenshot Intelligence; Speak → voice capture. Do **not** ship two of them as no-ops.
- [ ] **P1** Ring/chip animation loop under 60fps budget on an iPhone 12

### 5.2 Identity — `onboard_screen_4.JPG`
- [~] **P0** "Choose your path" · 2-column grid, 8 class cards, icon tile + name + class label ("Developer / Builder Class") — grid/cards/labels exist (`(onboarding)/identity.tsx`); layout not verified against the mockup pixel-for-pixel
- [ ] **P0** Empty state shows a ghosted "Select a path to unlock your class" bar; CTA disabled reading "Choose a path to continue" — CTA disables correctly, but reads generic "Continue," not this specific copy
- [ ] **P0** On select: card lifts + accent border + glow, class label animates in, CTA enables. Haptic tick. — border-highlight + CTA-enable only; no lift, no glow, no animation, no haptic
- [x] **P1** Single-select — real, backed by `useOnboardingDraft()`, not a local stub

### 5.3 Goals — `onboard_screen_5/6/7/8.JPG`
- [x] **P0** "What are you working toward?" · **multi-select** — real, backed by `useOnboardingDraft()`
- [ ] **P0** Sticky summary bar, live: "No campaigns selected · 0 XP" → "8 campaigns selected · ~8,000 XP/wk" — not built
- [~] **P0** Row: icon tile · title · `nn missions` mono chip · subtitle · accent progress bar · `+nnnn XP / week` · check control — icon tile/title/check exist; missions-count chip, subtitle, and XP/week are not shown yet (that data doesn't exist until Phase 7's mission templates do)
- [x] **P0** **Each row recolors to its campaign accent on selection** (§1.2) — real, using the pixel-sampled accents + `withAlpha`
- [x] **P0** CTA morphs "Select at least one goal" (disabled) → "Lock In My Missions" (gradient) — real (arrow glyph not added)
- [ ] **P1** Scroll under the sticky header with a fade mask (visible in `onboard_screen_6.JPG`)

### 5.4 AI profile generation — *spec only, `LockedIn.md` Screen 5*
- [ ] **P0** Staged scan animation: Understanding goals → Analyzing habits → Creating mission strategy → Building accountability plan
- [ ] **P0** Result card: Class / Strength / Challenge / Recommended Mode
- [ ] **P0** **Never block on the network.** If the API is slow or fails, complete onboarding with a locally-derived profile and refine in the background. A user stuck on a spinner at step 4 of 4 is a lost user.
- [ ] **P1** Minimum 2.5s dwell even when instant — the perceived-effort beat is the point of the screen

### 5.5 Auth
- [x] **P0** Sign in with Apple + email — `(onboarding)/auth.tsx` + `src/state/auth.tsx`, placed **after** step 4 as a distinct (unnumbered) 5th screen, not before step 1. On success, writes the accumulated identity/goals draft to `profiles`/`user_campaigns` and sets `onboarding_completed_at`. **Not verified end to end**: Apple sign-in needs a real device + Apple Developer account + the Supabase project's Apple OAuth provider configured (none of which exist yet); email auth needs a live Supabase project. Both call the real, correct SDK methods (confirmed against the installed packages' own `.d.ts` files — e.g. `expo-apple-authentication`'s exact `AppleAuthenticationButtonType`/`AppleAuthenticationScope` enum members, not guessed), but that's "compiles and calls the right function," not "confirmed working." First thing to check once a real project + Apple config exist.
- [ ] **P1** Guest mode → account upgrade, preserving onboarding answers — not built; currently auth is mandatory to finish onboarding at all

---

## Phase 6 — Dashboard
*Gate: answers "what matters today / how am I doing / what do I earn" in under 3 seconds.*

Per `LockedIn.md` Screen 6 + the §"Important Product Decision" in `docs/DESIGN-SYSTEM.md`: **the first screen after login shows one dominant mission, never a list.**

- [ ] **P0** Header: greeting ("Good Evening, David"), avatar, `LEVEL 18 BUILDER`, XP bar, streak chip with `flame`
- [ ] **P0** **Execution Score ring** — large, centered, animated count-up, "Today's Performance". Define the formula explicitly and document it; an opaque score users can't reason about breeds distrust.
- [ ] **P0** **Main Quest card** — visually dominant, `flame` marker, title, XP reward, time remaining, proof requirement chips
- [ ] **P0** Secondary missions — compact rows, clearly subordinate
- [ ] **P0** Empty state: "Your next achievement is waiting." + Create Mission (`LockedIn.md` Screen 16)
- [ ] **P1** AI insight card (the MVP stand-in for the cut AI Coach): "Mission risk detected" / "Your consistency improved"
- [ ] **P1** Pull-to-refresh, skeleton loaders in brand colors (never a grey shimmer)

---

## Phase 7 — Missions
*Gate: create → execute → complete works offline and survives app kill.*

### 7.1 Mission board — `LockedIn.md` Screen 7
- [ ] **P0** Sections: Main Quest · Side Missions · Daily Challenges *(Boss cut)*
- [ ] **P0** Mission card: title · difficulty · time remaining · XP · proof requirement · progress · status
- [ ] **P0** Difficulty scale (Standard → Epic) with visual weight, not just a label
- [ ] **P1** Filter/sort; swipe actions

### 7.2 Mission creation — `LockedIn.md` Screen 8
- [ ] **P0** Entry modes: Manual · Template · **AI generate** *(voice + screenshot import route into this flow)*
- [ ] **P0** **No forms.** Chips, sliders, toggles, stepper cards. The spec says this twice; it is the differentiator of the screen.
- [ ] **P0** Config: goal · difficulty · deadline · proof requirements · reward · accountability level
- [ ] **P1** Templates seeded per campaign (the `nn missions` counts in onboarding promise these exist — deliver them)

### 7.3 Active Mission Mode — `LockedIn.md` Screen 10
- [ ] **P0** Full-screen focus: title, large mono countdown, progress %, proof checklist
- [ ] **P0** Controls: Pause · Submit Proof · Activate Focus Mode
- [ ] **P0** **Timer correctness** — wall-clock derived, survives background/kill/reboot (§4.3). Test by force-quitting mid-mission.
- [ ] **P1** Keep-awake; Live Activity / Dynamic Island *(high delight, iOS-only, needs a config plugin — P1 not P0)*
- [ ] **P1** "Focus Mode" scope decision: true iOS Focus integration is a large native lift. MVP = in-app immersive state + notification suppression. Do not promise OS-level app blocking.

---

## Phase 8 — Proof & AI Verification
*Gate: a real proof round-trips to a verdict in under 8 seconds.*

### 8.1 🔒 Security — read before writing any AI code
- [ ] **P0** **The Anthropic API key never ships in the app bundle.** Not in `.env`, not in `app.json` `extra`, not in a build secret. Anything in the binary is extractable. **All Claude calls go through your own server function**, which holds the key and enforces per-user rate limits and spend caps.
- [ ] **P0** Server-side quota per user per day. A compromised client should cost you dollars, not thousands.
- [ ] **P0** Proof media in private storage with signed, expiring URLs. Never public buckets.

### 8.2 Proof submission — `LockedIn.md` Screen 11
- [ ] **P0** Options: Camera · Screenshot · Voice · File *(Connected App cut)*
- [ ] **P0** Each with icon, animation, description ("Record a 20 second explanation")
- [ ] **P0** Client-side compression before upload; upload progress; retry on failure
- [ ] **P1** Voice: waveform, 20s guide, playback before submit

### 8.3 Verification — `LockedIn.md` Screen 12
- [ ] **P0** Server function → Claude with vision. Model: **`claude-opus-5`** (1M ctx, $5/$25 per MTok).
- [ ] **P0** **Structured output** — `output_config: { format: {...} }` for a typed verdict `{ verified, confidence, reasoning, suggestedXp }`. Do not parse prose.
- [ ] **P0** `thinking: { type: 'adaptive' }` — verification is a judgment call and benefits from reasoning. **Do not use `budget_tokens`** (removed on Opus 5; returns 400).
- [ ] **P0** **Prompt-cache the system prompt + rubric** (`cache_control: { type: 'ephemeral' }`). It's identical on every call — this is ~90% off the input cost of the largest part of the request. Verify via `usage.cache_read_input_tokens`.
- [ ] **P0** Handle `stop_reason: 'refusal'` before reading `content` — a user could submit anything as "proof".
- [ ] **P0** Result screen: MISSION VERIFIED, confidence %, +XP, achievement unlock, celebration animation
- [ ] **P0** **Design the rejection path as carefully as the success path.** Low confidence → "Tell us more" / resubmit, never a bare failure. Per the spec's no-shame rule.
- [ ] **P1** Anti-gaming: verification is advisory, not adversarial. Do not build an arms race — flag anomalies for review instead.
- [ ] **P1** Log confidence distribution from day one; you cannot tune the threshold without it.

---

## Phase 9 — Gamification
*Gate: XP is auditable; a level-up feels like an event.*

- [ ] **P0** XP curve + level thresholds — tune the early curve so levels 1–5 come fast (retention) and later levels earn meaning
- [ ] **P0** XP awards written as `xp_events` (§4.2); totals always derived
- [ ] **P0** **Level-up full-screen moment** — "LEVEL 25 UNLOCKED", particles, haptic, sound. This is the emotional payoff of the entire product; give it real budget.
- [ ] **P0** Streak logic — timezone-correct day boundary, one grace day ("streak freeze") to prevent rage-quit churn
- [ ] **P0** **Failed mission = "Recovery Mode Activated."** No red, no shame, no broken-streak funeral. Explicit product requirement in `docs/DESIGN-SYSTEM.md`.
- [ ] **P1** Achievement engine — server-evaluated rules ("First Mission", "30 Day Streak", "Deep Focus Master")
- [ ] **P1** Badge artwork: 12–15 custom SVGs for MVP. Budget real design time; these carry the reward feeling.
- [ ] **P1** Class tier progression: Beginner → Builder → Executor → Master → Legend

---

## Phase 10 — Screenshot Intelligence 🌟
*Gate: pick 50 real screenshots, extract ≥10 genuine intentions, ≤2 false positives.*

**The differentiator. If only one thing is polished, it's this.**

- [ ] **P0** Permission priming screen *before* the OS prompt — explain the value, then ask. Never cold-prompt photo library access.
- [ ] **P0** Gallery picker + scanning animation, "Finding forgotten goals..."
- [ ] **P0** **Use the Batch API for bulk scans — 50% cost.** Scanning a camera roll is not latency-sensitive; the scan animation covers the wait. This is the single largest cost lever in the product.
- [ ] **P0** Structured extraction → `{ intention, category, confidence, sourceImageId }`
- [ ] **P0** Results: "Found 23 hidden intentions · 12 Career · 6 Learning · 5 Business" → per-item **Turn into mission / Review / Ignore**
- [ ] **P0** 🔒 **Privacy.** Screenshots are among the most sensitive data on a phone (DMs, banking, medical). Non-negotiable: process on-device where possible, transmit only what's needed, **never persist raw screenshots server-side**, delete after extraction, state it plainly in-app and in the privacy policy. Get this wrong once and the product is finished.
- [ ] **P0** Batch size caps + user-visible progress; never scan the whole library silently
- [ ] **P1** Incremental rescan (only new screenshots since last run)

---

## Phase 11 — Progress Profile
*Gate: the screen makes a user think "I am becoming better."*

- [ ] **P0** Avatar · level · class · XP · achievements grid · mission history · execution score
- [ ] **P0** Stats: consistency · focus · completion rate · growth trends
- [ ] **P1** **Charts** — before writing any chart code, load the `dataviz` skill. Trend lines and stat tiles here must read as one system with the dashboard rings, and dark-mode chart color is easy to get wrong.
- [ ] **P1** Weekly/monthly range toggle
- [ ] **P2** Shareable progress card (organic growth lever)

---

## Phase 12 — Monetization
*Gate: sandbox purchase → entitlement unlocks → restore works.*

- [ ] **P0** RevenueCat (`react-native-purchases`) — do not hand-roll StoreKit
- [ ] **P0** App Store Connect products: Free / Pro / Elite, monthly + annual
- [ ] **P0** Paywall — `LockedIn.md` Screen 15. **Not a SaaS pricing table**; a level-unlock screen. "Unlock your next level."
- [ ] **P0** Gate list: AI verification volume, Screenshot Intelligence, Focus Mode, advanced missions, XP bonuses
- [ ] **P0** **Server-side entitlement checks.** Never trust a client boolean for a paid AI call — that's your API bill.
- [ ] **P0** Restore purchases (Apple rejects without it); privacy policy + terms links on the paywall (also required)
- [ ] **P1** Free-tier limits generous enough to reach one verified mission — the aha moment must be free
- [ ] **P1** Trial + intro pricing

---

## Phase 13 — Retention
- [ ] **P0** Push permission primed after the first completed mission, never at launch
- [ ] **P0** Notification set: morning mission brief · mission deadline · streak at risk · verification complete
- [ ] **P0** Per-type notification preferences (blanket opt-out loses everything)
- [ ] **P1** Quiet hours; timezone-correct scheduling
- [ ] **P2** Home-screen widget: today's Main Quest + streak *(strong retention lever, real native cost)*

---

## Phase 14 — Polish, Motion, Accessibility
*Gate: 60fps on iPhone 12; VoiceOver can complete the core loop.*

### 14.1 Motion
- [ ] **P0** Card expand · XP fill · mission complete · level-up · scan · verification · voice states *(the `LockedIn.md` prototype list)*
- [ ] **P0** Reanimated worklets on the UI thread; no `setState` animation loops
- [ ] **P1** Profile on a real device — particles + blur + gradients is exactly the combination that drops frames

### 14.2 Accessibility — do not defer this
- [ ] **P0** **Contrast audit.** A dark, glassy, gradient-heavy UI fails WCAG constantly. Every text/background pair ≥ 4.5:1 (3:1 for ≥24px). The tertiary greys on Obsidian and the campaign accents (§1.2) are the known risks.
- [ ] **P0** VoiceOver labels on every interactive element; ring/progress values announced meaningfully ("Execution score 87 percent"), not as raw numbers
- [ ] **P0** 44×44pt minimum touch targets — several mockup check controls look smaller
- [ ] **P0** `prefers-reduced-motion` honored across all celebration animations
- [ ] **P1** Dynamic Type to 200%; test the mission card and goal rows specifically
- [ ] **P1** Never encode meaning in color alone — campaign accents and mission status need a shape or label too

### 14.3 Cross-platform
- [ ] **P1** Even though launch is iOS-only, keep Android rendering sane: blur, colored shadows, and font metrics all differ

---

## Phase 15 — Quality & Security
- [ ] **P0** Run `/security-review` before any TestFlight build — key handling, storage, media permissions, entitlement bypass
- [ ] **P0** Run `/code-review high` on every PR touching AI, payments, or XP math
- [ ] **P1** Unit tests: XP math, level thresholds, streak/timezone boundary, execution score — the logic where silent bugs destroy trust
- [ ] **P1** One E2E test covering the core loop
- [ ] **P1** Sentry (crash + error), analytics on the funnel (install → onboard complete → first mission → first verified → D1/D7)
- [ ] **P1** Bundle size + cold start budget
- [ ] **P2** `/simplify` pass at the end of each phase

---

## Phase 16 — Launch
- [ ] **P0** Privacy policy + terms (hosted, linked in-app)
- [ ] **P0** App Store privacy nutrition labels — photos, mic, camera, usage data. Must match actual behavior exactly.
- [ ] **P0** **App Review prep.** High-risk areas: photo library access breadth (§10 privacy), AI-generated content disclosure, subscription terms clarity, demo account with seeded data. Write the reviewer notes carefully.
- [ ] **P0** Screenshots + preview video *(the level-up moment is the hero shot)*
- [ ] **P0** TestFlight beta ≥ 20 users, ≥ 1 week
- [ ] **P1** ASO: name, subtitle, keywords, description
- [ ] **P1** Support email, crash triage rota, `expo-updates` channel for hotfixes
- [ ] **P2** Landing page + waitlist

---

## Tooling: Claude Code Setup for This Repo

### Skills to use, and when

| Skill | Use it for |
|---|---|
| `/init` | Root `CLAUDE.md` — do this first (§0.1) |
| `dataviz` | **Before** writing any chart in Phase 11. Load it, don't improvise dark-mode chart color. |
| `artifact-design` + `design` | Mocking the screens that have no mockup — Dashboard, Mission Board, Proof, Verification, Pricing (§0 says these are spec-only). Faster to iterate than in code. |
| `claude-api` | Every Phase 8/10 AI change. Model IDs and params drift; this skill is authoritative over recall. |
| `/code-review high` | AI, payments, XP math PRs (§15) |
| `/security-review` | Before every TestFlight build |
| `/simplify` | End of each phase |
| `/run` | Launching the app on device |
| `expo@claude-plugins-official` | ✅ already enabled in `app/.claude/settings.json` |

### Hooks — configured

A `PostToolUse` hook now runs `tsc --noEmit` after any `.ts`/`.tsx` edit in `app/`, so type errors surface at the moment they're introduced rather than at commit time.

- [ ] **P1** Add a Prettier-on-write hook once the formatter config lands (§0.3)
- [ ] **P2** Run `/fewer-permission-prompts` after a week of real work to trim the permission noise

---

## Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **Scope creep** — 16 screens + 5 AI systems | 🔴 Kills the timeline | §1 cut list, signed off before Phase 1 |
| **Screenshot privacy backlash** | 🔴 Product-ending | §10 privacy rules; on-device where possible; never persist raw |
| **AI cost per user** | 🟠 Unit economics | Prompt caching (§8.3), Batch API (§10), server-side quotas, paid gating |
| **AI key extracted from client** | 🔴 Unbounded bill | Server proxy only (§8.1) — never ship the key |
| **Verification false negatives** | 🟠 Users quit angry | Confidence threshold + generous resubmit path + logging (§8.3) |
| **Animation-heavy UI drops frames** | 🟠 Kills "premium" | Reanimated worklets, device profiling (§14.1) |
| **Dark glass UI fails accessibility** | 🟠 Rejection + exclusion | Contrast audit at token level, not at the end (§14.2) |
| **App Review rejection** | 🟠 Weeks of delay | §16 prep; restore purchases; honest privacy labels |
| ~~**Backend decision drifts**~~ | 🔴 ~~Blocks Phases 5–12~~ | **Resolved — Supabase (§4.1).** Schema scaffolded, client wired. Still blocked on an actual project existing: **the app currently crashes on launch without `app/.env.local` configured** (`src/lib/supabase.ts` throws loudly on missing env vars rather than failing silently) — this is intentional fail-fast, not a bug, but it means no one can run the app at all, including unrelated UI work, until a project exists. Create one and fill in `.env.local` before the next person picks this up. |

---

## Definition of Done (any task)

1. Matches the mockup, or the `LockedIn.md` spec where no mockup exists
2. Zero hardcoded hex, spacing, or font values — tokens only
3. Zero emoji in UI; icons come from the registry
4. Works offline, or degrades honestly
5. VoiceOver labelled, 4.5:1 contrast, 44pt targets
6. Reduced-motion path exists
7. Loading, empty, and error states all designed — not just the happy path
8. `npm run verify` clean
9. Tested on a real device, not just simulator

---

## Milestones

| Wk | Milestone | Gate |
|---|---|---|
| 1 | Foundation | Phase 0 · backend chosen · dev client on device |
| 2–3 | Design system + icons | Phases 1–2 · **real app icon shipped** |
| 3–4 | Shell + onboarding | Phases 3, 5 · pixel match on device |
| 5 | Data layer + dashboard | Phases 4, 6 |
| 6–7 | Missions end to end | Phase 7 · timer survives app kill |
| 8 | **Proof + AI verification** | Phase 8 · 🎯 **core loop closes — the real milestone** |
| 9 | Gamification | Phase 9 · level-up moment lands |
| 10 | Screenshot Intelligence | Phase 10 · accuracy gate met |
| 11 | Profile + paywall | Phases 11–12 · sandbox purchase works |
| 12 | Polish + a11y | Phase 14 · 60fps, contrast pass |
| 13 | Beta | TestFlight, 20+ users |
| 14 | **Submit** | Phase 16 |

**The week 8 gate is the one that matters.** Everything before it is setup; everything after is amplification. If week 8 slips, cut Phase 11 and 13 scope — do not cut Phase 10.
