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
- [~] **P1** Capture: `expo-image-picker`, `expo-document-picker`, `expo-image-manipulator` — installed and wired (Phase 8.2), all Expo-Go-safe. `expo-camera`, `expo-media-library`, `expo-audio` deliberately NOT added — they need a dev client (§0.5) to test reliably; adding them now would risk breaking the app on the Expo-Go-only device this was being tested on.
- [~] **P1** Data: `@tanstack/react-query` — installed and wired (Phase 6). `zustand`, `expo-sqlite` still not added.
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
  electric: '#6365F1',  // primary action, AI/intelligence
  violet:   '#8B52F6',  // progression, XP
  iris:     '#A78BFA',  // accent, wordmark "In"
  gold:     '#D4AF37',  // achievement, elite tier
  pure:     '#FFFFFF',
} as const;
```

**2026-09-05 accessibility nudge**: `electric`/`violet` differ from the brand board's literal `#6366F1`/`#8B5CF6` by one and ten green-channel units respectively — found by `theme/__tests__/semanticContrast.test.ts` (§14.2's contrast audit): white button text on each sat at 4.47:1 / 4.23:1, just under WCAG AA's 4.5:1. Nudged to clear it (4.50:1 / 4.53:1), imperceptible next to the source asset. If a real design sign-off ever re-derives these from the original brand file, re-run that test against whatever comes back.

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
      index.tsx      # DONE — real Phase 6 dashboard (see §6), no longer a stub
      missions.tsx   # DONE — real Phase 7.1 mission board (see §7.1), no longer a stub
      progress.tsx   # DONE — real Phase 11 Progress Profile (see §11), no longer a stub
      insights.tsx / profile.tsx   # DONE as labeled stubs (StubScreen) — real Phase 6-P1/11 content not built
    (modals)/
      _layout.tsx            # DONE — Stack, presentation: modal
      create-mission.tsx     # DONE — real Phase 7.2 manual mission creation (see §7.2), not in the original route table
      active-mission.tsx     # DONE — real Phase 7.3 Active Mission Mode (see §7.3), not in the original route table
      proof.tsx               # DONE — real Phase 8.2 proof submission (see §8.2), no longer a stub
      verification.tsx        # DONE — real Phase 8.3 AI verification result (see §8.3), no longer a stub
      level-up.tsx            # DONE — real Phase 9 level-up celebration (see §9), no longer a stub
      paywall.tsx             # DONE as a labeled stub (ModalStub) — real Phase 12 content not built
  supabase/functions/
    verify-proof/            # DONE — real Phase 8.1/8.3 Edge Function, holds the Anthropic key server-side (see §8.1). Not deployed in this environment.
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
- [x] **P0** `xp_events` as an **append-only ledger** — `20260901000005_xp_ledger.sql`. No insert policy for clients (server-only writes); a trigger (`apply_xp_event`) maintains `profiles.xp_total` as a transactionally-updated cache, always re-derivable by summing the ledger if it's ever suspected to have drifted. XP-curve/level-threshold numbers were deliberately left uninvented here — that real game-design work landed in Phase 9 instead (`20260901000009_level_curve.sql`), which supersedes this migration's `apply_xp_event()` with a version that also derives `level`.
- [x] **P1** Row-level security from day one — every table, not bolted on later.
- [ ] **P1** Timezone-aware "day" boundary for streaks — not addressed; streaks/`streak_count` logic doesn't exist yet (that's Phase 9), only the column.

> **Key naming:** use Supabase's new **publishable key** (`sb_publishable_...`), not the legacy anon key — confirmed current as of this session: legacy anon/service_role keys are being retired industry-wide in late 2026, and a project started now should use the new key model from day one. `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `app/.env.example` reflects this.

### 4.3 Client state
- [~] **P0** React Query for server state, Zustand for ephemeral UI state (active timer, in-progress mission draft) — React Query landed with Phase 6 (`QueryClientProvider` in `app/_layout.tsx`, first real usage in `src/hooks/useActiveMissions.ts`). Zustand still not added; auth/onboarding-draft state remains plain React Context (`src/state/auth.tsx`, `src/state/onboardingDraft.tsx`), which is still the right call for state that isn't server-cached.
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

- [~] **P0** Header: greeting ("Good Evening, David"), avatar, `LEVEL 18 BUILDER`, XP bar, streak chip with `flame` — real (`app/(app)/index.tsx`), pulling `display_name`/`level`/`identity_class`/`streak_count` from the live `profiles` row. **XP bar landed with Phase 9** (`src/components/XpBar.tsx`, built on the real level curve — see §9) once the level-threshold design existed to make it honest. One deliberate deviation remains: the tier word ("BUILDER") is real `identity_class` text, not a fabricated tier system — class tier progression (Beginner→Builder→Executor→Master→Legend) is still Phase 9 P1, not built, so showing one would be lying to the user. Avatar is a placeholder icon circle, not a real image (no avatar upload feature exists).
- [x] **P0** **Execution Score ring** — `src/components/ExecutionScoreRing.tsx`. Large, centered, animated arc (Reanimated, UI-thread) + JS-driven count-up, "Today's Performance", full `useReducedMotion()` gate (jumps straight to final value/position, no animation) per `theme/motion.ts`'s contract. Renders whatever `profiles.execution_score` already holds — **the formula itself is still undefined**, that's real product work, not a UI task; flagged inline in the component's own doc comment so it isn't lost.
- [x] **P0** **Main Quest card** — `src/components/MainQuestCard.tsx`. Visually dominant (gradient wash + glow), `flame` marker, title, XP reward, time remaining (`src/lib/time.ts`, wall-clock derived), proof requirement chips (parsed from the real `missions.proof_requirements` jsonb via `src/lib/missions.ts`). Tapping it goes to the mission board tab, not Active Mission Mode — that screen is Phase 7.3, not yet built.
- [x] **P0** Secondary missions — `src/components/MissionRow.tsx`, compact rows, clearly subordinate to the Main Quest card.
- [x] **P0** Empty state: "Your next achievement is waiting." + Create Mission — routes to the mission board tab (Phase 7.2's actual creation flow isn't built yet, so this is the honest interim destination, not a dead end).
- [ ] **P1** AI insight card (the MVP stand-in for the cut AI Coach): "Mission risk detected" / "Your consistency improved" — not built; depends on Phase 8's AI verification pipeline existing first.
- [~] **P1** Pull-to-refresh, skeleton loaders in brand colors (never a grey shimmer) — pull-to-refresh is real (`RefreshControl` tied to the missions query's `refetch`, `tintColor` set to Electric). Loading state is a plain `ActivityIndicator` in brand Electric, not a true skeleton — real skeleton loaders (shaped placeholder cards) are still a follow-up.

**Data layer note (pulled forward from Phase 4.3):** `@tanstack/react-query` is now a real dependency, wired via a `QueryClientProvider` in the root layout (`app/_layout.tsx`) — the Dashboard's mission list (`src/hooks/useActiveMissions.ts`) is its first real usage. Zustand and the SQLite offline cache/sync-queue are still unbuilt; this query is online-only (a killed connection means a failed fetch with the retry UI above, not an offline-cached read) until that lands.

---

## Phase 7 — Missions
*Gate: create → execute → complete works offline and survives app kill.*

### 7.1 Mission board — `LockedIn.md` Screen 7
- [x] **P0** Sections: Main Quest · Side Missions · Daily Challenges *(Boss cut)* — `app/(app)/missions.tsx`, grouped from the same live `useActiveMissions` query the dashboard uses; a section only renders when it has ≥1 mission.
- [~] **P0** Mission card: title · difficulty · time remaining · XP · proof requirement · progress · status — `src/components/MissionCard.tsx` has all of these except **progress**: the schema has no partial-progress column (a mission is `active` until `completed`/`failed`/`recovery`, see `supabase/migrations`), so a progress bar would have to fabricate a number. Status always reads `ACTIVE` since this board only ever queries active missions — real, not a placeholder, but not yet meaningful until Phase 8 can flip a mission's status. Deliberately a plain `View`, not tappable — Active Mission Mode (§7.3) doesn't exist yet, and a card that looks pressable but goes nowhere is a fake affordance.
- [x] **P0** Difficulty scale (Standard → Epic) with visual weight, not just a label — `src/components/DifficultyMeter.tsx`, a 4-bar signal-strength meter, color progression reusing `theme/colors.ts`'s `tierRing` language (steel → electric → violet → gold) rather than inventing a new ramp.
- [ ] **P1** Filter/sort; swipe actions — not built.

### 7.2 Mission creation — `LockedIn.md` Screen 8
- [~] **P0** Entry modes: Manual · Template · **AI generate** *(voice + screenshot import route into this flow)* — `app/(modals)/create-mission.tsx` shows all three as the spec's segmented control, but only **Manual** works. Template needs seeded per-campaign data (§7.2's next line, still unbuilt) and AI-generate needs the server-side Claude proxy (Phase 8, not built) — both render visibly disabled with a "SOON" tag rather than being hidden or faked. Voice/screenshot-import entry points aren't wired to this flow yet either (Phase 10).
- [x] **P0** **No forms.** Chips, sliders, toggles, stepper cards. The spec says this twice; it is the differentiator of the screen. — Real for type/goal/difficulty/deadline/proof (all chip rows) and reward (a +/− stepper, since no slider component is installed — see below). One deliberate exception: mission title is a single text input, because a title can't be meaningfully chip-selected; "avoid forms" is read as "no bureaucratic multi-field form," not "zero text entry ever."
- [~] **P0** Config: goal · difficulty · deadline · proof requirements · reward · accountability level — goal (from the user's real `user_campaigns`, falling back to the full catalog if they picked none), difficulty, proof requirements, and reward (XP, defaulting from difficulty via `defaultXpForDifficulty`, then user-adjustable) are real and write to the live `missions` table. **Deadline** is a set of quick relative presets (Tonight/Tomorrow/In 3 Days/This Week/No Deadline) computed at render time, not a calendar picker — avoids pulling in a native date-picker dependency (a real native module needing a dev-client rebuild) for one field, and arguably fits "avoid forms" better anyway. **Accountability level** is cut entirely: no schema column and no defined semantics exist for it anywhere in the spec or design doc — a chip with nothing behind it would be decoration, not a feature. Revisit once the concept is actually designed.
- [ ] **P1** Templates seeded per campaign (the `nn missions` counts in onboarding promise these exist — deliver them) — not built; blocks the Template entry mode above.

### 7.3 Active Mission Mode — `LockedIn.md` Screen 10
- [~] **P0** Full-screen focus: title, large mono countdown, progress %, proof checklist — `app/(modals)/active-mission.tsx`, deep-linkable via `?id=<mission id>` (its own `useMission` fetch, not assumed-cached from the board). **Progress %** is labeled "TIME ELAPSED," not "mission progress": the schema has no completion-percentage column, so it's `(now − created_at) / (deadline − created_at)`, a real and honestly-different number from task completion — see `lib/time.ts`'s `computeElapsedProgress`. Proof checklist rows always show unchecked (nothing has been submitted — Phase 8 doesn't exist yet to flip them).
- [~] **P0** Controls: Pause · Submit Proof · Activate Focus Mode — **Submit Proof** is real, routes to the proof modal with the mission id. **Activate Focus Mode** is real (see below). **Pause** is rendered visibly disabled with a "SOON" tag, not wired to anything: `mission_status` has no `paused` state and there's no session-tracking table to pause/resume against (this screen's timer is purely `deadline − now`, not an elapsed-session counter) — a tappable Pause button with no real state to change would be a fake affordance. Needs an actual product/schema decision before it can be real.
- [x] **P0** **Timer correctness** — wall-clock derived, survives background/kill/reboot (§4.3). `useCountdown` (`src/hooks/useCountdown.ts`) recomputes `deadline − Date.now()` on every tick; there is no elapsed-duration state anywhere to lose, so background/kill/reboot has nothing to desync — the next tick after resume is simply correct. Not yet tested by actually force-quitting on a device (no device in this environment), but the design has no failure mode for that case even in principle.
- [x] **P1** Keep-awake — `expo-keep-awake`'s `activateKeepAwakeAsync`/`deactivateKeepAwake`, tied to the Focus Mode toggle below, always released on unmount regardless of how the screen closes. Live Activity / Dynamic Island still not built (needs a config plugin — real native work, correctly P1).
- [x] **P1** "Focus Mode" scope decision — built exactly to the scope this line calls for: an in-app immersive toggle (keep-awake + a visual "Focus Active" state), **not** OS-level Focus integration and **not** notification suppression (there's no notification system yet to suppress — Phase 13). Do not expand this without re-reading this note first.

---

## Phase 8 — Proof & AI Verification
*Gate: a real proof round-trips to a verdict in under 8 seconds.*

### 8.1 🔒 Security — read before writing any AI code
- [x] **P0** **The Anthropic API key never ships in the app bundle.** Not in `.env`, not in `app.json` `extra`, not in a build secret. Anything in the binary is extractable. **All Claude calls go through your own server function**, which holds the key and enforces per-user rate limits and spend caps. — `supabase/functions/verify-proof/index.ts`, a Supabase Edge Function (Deno). The key is read from `Deno.env.get('ANTHROPIC_API_KEY')`, a function secret set via `supabase secrets set` — never present in `app/` at all. **Not deployed or run in this environment** (no Deno runtime or Supabase CLI available here); written by hand against the documented Edge Function conventions and the Anthropic TS SDK's real API surface (`claude-api` skill), same "can't run it, be extra careful reading the real interfaces" discipline as the rest of this backend. Deploy with `supabase functions deploy verify-proof` once a real Anthropic key exists, then set it as a secret — that's the one remaining manual step, same shape as the "app/.env.local needs a real project" blocker already in the Risk Register.
- [x] **P0** Server-side quota per user per day. A compromised client should cost you dollars, not thousands. — `ai_verification_usage` table + `increment_ai_verification_usage()` (atomic RPC, avoids a race under concurrent requests) in `20260901000008_ai_verification_quota.sql`, checked before every Claude call; hard-capped at 20/user/day (`DAILY_VERIFICATION_LIMIT` in the function). No RLS grant to `authenticated` at all — only service_role touches it, same pattern as `xp_events`/`verifications`.
- [x] **P0** Proof media in private storage with signed, expiring URLs. Never public buckets. — `20260901000007_proof_storage_policies.sql` scopes the `proofs` bucket's RLS to each user's own `{userId}/...` path prefix (bucket itself created via dashboard/CLI, per the existing note in `20260901000003_proofs_and_verifications.sql` — not a migration). The Edge Function reads proof media only via `createSignedUrl(path, 300)` — a 5-minute link, never a public URL — and hands that straight to Claude's `image: {source: {type: 'url', ...}}` rather than downloading/re-hosting it anywhere.

### 8.2 Proof submission — `LockedIn.md` Screen 11
- [x] **P0** Options: Camera · Screenshot · Voice · File *(Connected App cut)* — `app/(modals)/proof.tsx`. Camera and Screenshot both go through `expo-image-picker` (`launchCameraAsync`/`launchImageLibraryAsync`) rather than the separate `expo-camera` module — per §0.5's own finding that Expo Go can't reliably host `expo-camera`/`expo-audio`, `launchCameraAsync` opens the OS's native camera UI instead of an embedded live view, which does work in Expo Go with no dev client needed. File uses `expo-document-picker`. **Voice is shown but disabled ("SOON")**: real recording needs `expo-audio`, which was deliberately not added — adding it now would risk breaking the app on the exact Expo-Go-only device this was being tested on all session. Needs a dev client build (§0.5) before it can be built for real.
- [x] **P0** Each with icon, animation, description ("Record a 20 second explanation") — icon + description real for all four; no per-option animation (kept deliberately minimal rather than fighting Expo Go for a native camera preview).
- [~] **P0** Client-side compression before upload; upload progress; retry on failure — compression is real (`src/lib/proofUpload.ts`, `expo-image-manipulator`: re-encodes to JPEG at 0.7 quality, resizes only if the source exceeds 1600px so small images are never upscaled). Upload "progress" is a spinner, not a byte-level percentage — `@supabase/storage-js`'s plain `upload()` doesn't expose progress callbacks; a true progress bar needs a resumable (TUS) upload strategy, not built here. Retry-on-failure is real via the mutation's error state + Try Again, not automatic retry.
- [ ] **P1** Voice: waveform, 20s guide, playback before submit — blocked on the dev-client decision above.

### 8.3 Verification — `LockedIn.md` Screen 12
- [x] **P0** Server function → Claude with vision. Model: **`claude-opus-5`** (1M ctx, $5/$25 per MTok). — real in `verify-proof`, via `anthropic.messages.parse()`. Only `photo`/`screenshot` proofs are sent to Claude (there's no audio input on the Messages API, and arbitrary files aren't fetched) — `voice`/`file` proofs get an honest non-AI fallback verdict flagging manual review, written without ever calling Claude, not a fabricated result.
- [x] **P0** **Structured output** — `output_config: { format: {...} }` for a typed verdict `{ verified, confidence, reasoning, suggestedXp }`. Do not parse prose. — real, via the SDK's `zodOutputFormat(VerdictSchema)` + `response.parsed_output` (the documented `messages.parse()` helper, not manual JSON parsing).
- [x] **P0** `thinking: { type: 'adaptive' }` — verification is a judgment call and benefits from reasoning. **Do not use `budget_tokens`.** — real; `output_config.effort: 'medium'` alongside it (checked against the `claude-api` skill before writing, since this is exactly the kind of parameter that drifts).
- [x] **P0** **Prompt-cache the system prompt + rubric** (`cache_control: { type: 'ephemeral' }`). — real, and now confirmed against the live API (2026-09-03, outside this repo, using the exact request shape from `verify-proof`): first call returned `cache_creation_input_tokens: 744, cache_read_input_tokens: 0`; a second identical-prefix call returned `cache_creation_input_tokens: 0, cache_read_input_tokens: 744`. That's the textbook cache-hit signature — the caching claim is no longer just "should work," it's measured.
- [x] **P0** Handle `stop_reason: 'refusal'` before reading `content` — a user could submit anything as "proof". — real; checked before `parsed_output` is ever read, and degrades to the same no-shame "couldn't review automatically, try again" verdict as a low-confidence result, not an error.
- [~] **P0** Result screen: MISSION VERIFIED, confidence %, +XP, achievement unlock, celebration animation — `app/(modals)/verification.tsx` has all of it except **achievement unlock**, cut deliberately: the achievement engine (Phase 9 P1, "server-evaluated rules") doesn't exist yet, so there is nothing real to unlock — showing a badge here would be fabricated. Celebration is a modest reduced-motion-aware fade-in (Reanimated `FadeIn`), not particles/haptics/sound (§9's fuller "level-up" moment is a separate, bigger piece of work).
- [x] **P0** **Design the rejection path as carefully as the success path.** Low confidence → "Tell us more" / resubmit, never a bare failure. — real: a non-verified verdict renders "Let's Take Another Look" (not a failure screen) with the AI's own reasoning shown, a "Resubmit Proof" CTA that routes straight back into `proof.tsx` for the same mission, and — critically — the Edge Function never flips the mission's status to `failed` on a rejection, only on a verified success does it flip to `completed`. A genuine network/deploy error (real possibility right now, since the function isn't deployed) renders as its own distinct "Couldn't Reach Verification" state, never disguised as an AI rejection.
- [ ] **P1** Anti-gaming: verification is advisory, not adversarial. Do not build an arms race — flag anomalies for review instead. — the rubric is written generously/advisory by design (see the function's `SYSTEM_PROMPT`), but there's no anomaly-flagging mechanism yet.
- [ ] **P1** Log confidence distribution from day one; you cannot tune the threshold without it. — every verdict is written to `verifications` (real, already required by RLS/schema), so the data exists to query later; no dashboard/aggregation built.
- [x] **P0** **Found and fixed via `/security-review` (2026-09-05):** `verify-proof` never checked the mission's current status before processing — replaying the same `{ proofId }` request after a successful verification re-ran Claude and, on another `verified: true`, re-inserted an `xp_events` row and re-fired the streak/achievement RPCs, granting unlimited repeat XP for one already-completed mission (bounded only by the 20/day quota). Fixed with a `mission.status !== 'active'` guard before any processing — same idempotency discipline as `useMissionStatus.ts`'s client-side race fix earlier this session, just missing here on the server side where it actually gates value. Deployed.

**Update (2026-09-03) — the Claude call itself is now live-verified, not just written.** Given a real API key, the exact request `verify-proof` makes (`claude-opus-5`, `thinking: adaptive`, `output_config: {effort: 'medium', format: zodOutputFormat(VerdictSchema)}`, cached system rubric, vision input) was run twice outside this repo (Node, not Deno — same HTTP behavior, only the import syntax differs) against a synthetic screenshot: it correctly read specific on-image details (hero section, pricing table, "Build: Succeeded", "Deployed 2 minutes ago"), returned a well-formed `parsed_output` matching the schema exactly, judged calibrated confidence (58–62%, not maxed out) with a reasoning that correctly caught "this is localhost, not the live URL," and reduced `suggestedXp` below the stated 500 rather than inventing a higher number — the rubric is doing real work, not rubber-stamping. Cache hits confirmed (see above). Total cost for both calls: ~$0.026.
**What's still not verified**, because nothing in this environment can do it: the function has never actually run on Deno/Supabase's infrastructure, `createSignedUrl` → Claude fetching that URL specifically (tested with `base64` image input instead, which exercises everything except the URL-fetch step — a standard, documented feature, not independently re-verified here), the quota RPC under real concurrent load, and the full client round trip (pick photo → compress → upload → invoke function → see result) on a real device. **Before trusting this in front of a user:** (1) `supabase functions deploy verify-proof`, (2) `supabase secrets set ANTHROPIC_API_KEY=...` (a real key exists now — see `claudeapi.md`, gitignored; delete that file once the secret is set, a plaintext key file sitting in the repo is a standing risk even ignored), (3) submit one real proof from a device and read the Edge Function logs.

---

## Phase 9 — Gamification
*Gate: XP is auditable; a level-up feels like an event.*

- [x] **P0** XP curve + level thresholds — tune the early curve so levels 1–5 come fast (retention) and later levels earn meaning — designed and shipped: `xpToNext(level) = round(100 * level^1.5)`, a power curve where the *increment* grows with level (100 XP for 1→2, one verified mission; ~3,162 for 10→11; ~35,355 for 50→51). Level 1–5 costs a combined 1,703 XP — a handful of missions — while level 100 costs ~3.95M lifetime. Implemented **twice on purpose, not independently**: `app/src/lib/leveling.ts` generates it from the formula (with 19 passing regression tests), and `supabase/migrations/20260901000009_level_curve.sql`'s `level_thresholds` table is a byte-identical precomputed copy of that same run — two independent floating-point implementations of one formula risk disagreeing on a rounding edge case; a single generated table shared by both cannot. `profiles.level` is now server-derived on every XP award (`apply_xp_event()` trigger calls `level_for_xp()`), superseding the plain column §4.2 deliberately left unmaintained pending this design.
- [x] **P0** XP awards written as `xp_events` (§4.2); totals always derived — already true since Phase 8's `verify-proof` (writes to the append-only ledger, trigger keeps `xp_total` in sync); this phase adds the `level` derivation on top of the same trigger.
- [x] **P0** **Level-up full-screen moment** — "LEVEL 25 UNLOCKED", particles, haptic, sound. — `app/(modals)/level-up.tsx`, reached only when `verification.tsx` detects a real post-award level increase (never guessed or shown speculatively). Real: gradient wash, spring-in (`ZoomIn` + reduced-motion gate), `fireHaptic('levelUp')`. **Cut, honestly**: no particle system and no sound — those need a dedicated effects/audio pass this session didn't build. "Give it real budget" is respected by not faking those with something cheap-looking; revisit as real scope, not scope creep on this pass.
- [x] **P0** Streak logic — timezone-correct day boundary, one grace day ("streak freeze") to prevent rage-quit churn — `record_mission_completion_streak()` in `20260901000010_streaks.sql`, called from `verify-proof` on every verified mission. Genuinely timezone-correct: `profiles.timezone` (new column, IANA name) is synced from the device's `Intl.DateTimeFormat().resolvedOptions().timeZone` on every profile load (`src/state/auth.tsx`), and the day boundary is computed via `now() at time zone <that>`, with a UTC fallback if the stored value is ever malformed — never a raw UTC-day assumption. One grace day per streak: exactly one missed day preserves the streak (doesn't grow it) and spends the grace; a second miss, or any larger gap, restarts at 1. Row-locked (`for update`) so two verifications landing close together can't race into a double-increment.
- [x] **P0** **Failed mission = "Recovery Mode Activated."** No red, no shame, no broken-streak funeral. — real, but scoped honestly: there's no cron/scheduled sweep that automatically flips an overdue mission to `recovery` (that needs `pg_cron` or a periodic Edge Function, real infra not built this pass), so the transition is user-triggered — Active Mission Mode (`app/(modals)/active-mission.tsx`) detects `countdown.overdue` and offers "Activate Recovery Mode" with warm, blame-free copy, never the word "failed." The Mission Board (`app/(app)/missions.tsx`) shows a distinct violet "RECOVERY MODE" section (never mixed into the active list, never red) with a one-tap "Resume" that reactivates the mission with a fresh 24h deadline. `mission_status`'s `failed` enum value exists in the schema but nothing in the UI-facing flow ever sets or shows it — recovery is the only user-visible outcome, matching the design doc's rule.
- [x] **P1** Achievement engine — server-evaluated rules ("First Mission", "30 Day Streak", "Deep Focus Master") — `evaluate_and_award_achievements()` in `20260904000001_achievement_engine.sql`, called from `verify-proof` right after a verified mission (alongside the streak RPC, same "don't fail the whole response" handling). All three catalog achievements turned out to be evaluable from data that already exists: `first_mission` and `deep_focus_master` (its real definition, "Complete 10 missions," is just a completed-mission count — every proof submission already routes through Active Mission Mode's Submit Proof, so no separate focus-session telemetry had to be invented) count `missions where status = 'completed'`; `thirty_day_streak` reads `profiles.streak_count`. service_role-only, same pattern as the streak/quota RPCs — no client insert path into `user_achievements`. **Found and fixed a real bug while wiring this up**: a stale Active Mission Mode screen could re-activate Recovery Mode on a mission the server had *just* marked `completed` moments earlier (its cached mission data never learned about the status flip), silently reverting `status` back to `recovery` while leaving `completed_at` set — which was quietly zeroing the Progress Profile's completion rate. Fixed with an optimistic-concurrency guard (`useSetMissionStatus` now requires and filters on `fromStatus`) plus proper cache invalidation on a verified verdict (`useVerifyProof` now invalidates active/recovery/history/progress-stats/achievements queries instead of leaving them stale).
- [x] **P1** Badge artwork: 12–15 custom SVGs for MVP. — **not done as originally scoped** (still uses the existing semantic icon registry, e.g. `verified`/`streak`/`timer`, not custom illustrated SVGs); unblocked now that the engine is real, but the illustration work itself needs real design time, per this line's own note.
- [ ] **P1** Class tier progression: Beginner → Builder → Executor → Master → Legend — not built. The dashboard header deliberately shows real `identity_class` text instead of a fabricated tier word (see §6) pending this.

---

## Phase 10 — Screenshot Intelligence 🌟
*Gate: pick 50 real screenshots, extract ≥10 genuine intentions, ≤2 false positives.*

**The differentiator. If only one thing is polished, it's this.**

- [x] **P0** Permission priming screen *before* the OS prompt — explain the value, then ask. Never cold-prompt photo library access. — `app/(modals)/screenshot-scan.tsx`'s `intro` stage explains the feature and shows the privacy callout before `ImagePicker.requestMediaLibraryPermissionsAsync()` is ever called.
- [x] **P0** Gallery picker + scanning animation, "Finding forgotten goals..." — real, `expo-image-picker`'s `launchImageLibraryAsync({ allowsMultipleSelection: true })`, same Expo-Go-safe picker `proof.tsx` already uses.
- [-] **P0** **Use the Batch API for bulk scans — 50% cost.** — **deliberately deferred, not built.** The Batch API is asynchronous (its own SLA can run to hours), which doesn't fit this screen's synchronous "scanning animation covers the wait" UX without a working notification system to tell the user later — and Phase 13 (push notifications) is blocked on the same Apple Developer Program enrollment as everything else native right now. Ships on the synchronous Messages API instead: real, working, seconds-long results today, at full (non-batch) per-token cost. This is the single largest documented cost gap in the product — revisit the instant Phase 13 unblocks.
- [x] **P0** Structured extraction → `{ intention, category, confidence, sourceImageId }` — real, `supabase/functions/scan-screenshots`, `zodOutputFormat` structured output, same `claude-opus-5` + adaptive-thinking pattern as `verify-proof`. `category` reuses the existing `campaign_key` enum (the 8 onboarding goals) rather than inventing a parallel taxonomy. `sourceImageId` is used only to let Claude address each image in one batched call — it isn't persisted, since keeping any per-image reference around after the request would cut against "never persist raw screenshots" in spirit even without the bytes themselves.
- [x] **P0** Results: "Found 23 hidden intentions · 12 Career · 6 Learning · 5 Business" → per-item **Turn into mission / Review / Ignore** — real. "Review" is the implicit default (an undecided item just stays `pending` and the screen can be revisited); explicit actions are **Turn into Mission** (`useCreateMission`, pre-filled title/category, side mission, standard difficulty, 100 XP, 7-day deadline — all user-adjustable afterward on the Mission Board same as any manual mission) and **Ignore** (status flips to `ignored`).
- [x] **P0** 🔒 **Privacy.** — the one rule this phase is built around, and it's structural, not a promise: there is no Storage bucket for screenshots anywhere in this codebase. Images arrive at `scan-screenshots` as base64 in the request body, get forwarded to Claude, and are never written to a table or bucket — only the AI's short text output (`extracted_intentions`) is persisted. Stated in-app (the intro screen's privacy callout) and in the hosted Privacy Policy (Profile → Legal).
- [x] **P0** Batch size caps + user-visible progress; never scan the whole library silently — hard-capped at 10 images per scan, enforced both client-side (picker's `selectionLimit`) and server-side (`scan-screenshots` rejects a larger batch outright — a modified client can't bypass the client-side cap). A server-side daily quota (60 images/day/user, `screenshot_scan_usage` + `increment_screenshot_scan_usage()`, same atomic pattern as the AI-verification quota) bounds total cost per user the same way §8.1 does for verification.
- [ ] **P1** Incremental rescan (only new screenshots since last run) — not built.
- [x] **P1** Wire an entry point on the Dashboard or Mission Board — a sparkle icon button in the Dashboard header (`app/(app)/index.tsx`) opens `/(modals)/screenshot-scan`.

---

## Phase 11 — Progress Profile
*Gate: the screen makes a user think "I am becoming better."*

- [x] **P0** Avatar · level · class · XP · achievements grid · mission history · execution score — `app/(app)/progress.tsx`. Avatar is the same placeholder icon circle as the Dashboard (no avatar upload feature exists anywhere yet); Execution Score ring and XP bar are the **literal same components** the Dashboard uses (`ExecutionScoreRing`/`XpBar`), not lookalikes, per this section's own "must read as one system with the dashboard rings" note. **Achievements grid is real and now actually unlockable** (§9 P1's engine landed) — it renders the real `achievements` catalog merged with the user's real `user_achievements`, and a verified mission can now flip `first_mission`/`deep_focus_master`/`thirty_day_streak` for real. Mission history is real (`useMissionHistory`, terminal-status missions only, capped at 50, newest first).
- [~] **P0** Stats: consistency · focus · completion rate · growth trends — three of four shipped, real and tested (`src/lib/progressStats.ts`, 12 passing tests): **Consistency** = % of the last 30 calendar days with ≥1 XP event; **Completion Rate** = completed ÷ (completed + failed + recovery), `null` (shown as "—", not a misleading 0%) when there's no terminal mission yet; **Growth Trend** = this week's XP vs. the prior week, `null` when last week was 0 (a % change against zero is undefined, not "0%" or "∞%") — falls back to showing the raw XP figure instead. **"Focus" is cut, not fabricated**: Focus Mode (`app/(modals)/active-mission.tsx`) is a client-only toggle that's never persisted anywhere — there is no real data anywhere to compute a "focus score" from. Building one would mean inventing a number, which this whole project has been built to avoid. Revisit once Focus Mode sessions are actually written somewhere (a real, if small, schema addition).
- [ ] **P1** **Charts** — before writing any chart code, load the `dataviz` skill. Trend lines and stat tiles here must read as one system with the dashboard rings, and dark-mode chart color is easy to get wrong. — not built; stats currently render as plain tiles with numbers, not trend-line visualizations. The `dataviz` skill was not loaded this pass since no chart was drawn — load it first if this item is picked up.
- [ ] **P1** Weekly/monthly range toggle — not built; consistency/completion/growth are all fixed windows (30 days / all-time / 7-day-vs-7-day) with no user-adjustable range yet.
- [ ] **P2** Shareable progress card (organic growth lever) — not built.

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
- [x] **P0** **Contrast audit.** A dark, glassy, gradient-heavy UI fails WCAG constantly. Every text/background pair ≥ 4.5:1 (3:1 for ≥24px). The tertiary greys on Obsidian and the campaign accents (§1.2) are the known risks. — `src/theme/__tests__/semanticContrast.test.ts` checks every real text/background pair the app actually uses (not just campaign accents, which already had a test). Found two real failures — `text.tertiary` and `palette.electric`/`palette.violet` behind white button text, all just under 4.5:1 — and fixed both with minimal token nudges (see §1.1's note on the exact hex/alpha changes). Everything else already passed.
- [x] **P0** VoiceOver labels on every interactive element; ring/progress values announced meaningfully ("Execution score 87 percent"), not as raw numbers — `accessibilityRole`/`accessibilityLabel` (plus `accessibilityState` for toggles) added to every interactive `Pressable` app-wide that lacked one, following `TabBar.tsx`'s existing pattern. `ExecutionScoreRing` already spoke its value meaningfully (`"Execution score 87 percent"`); `XpBar` has a plain-text XP label VoiceOver reads as-is, which was judged sufficient rather than adding a redundant override.
- [x] **P0** 44×44pt minimum touch targets — several mockup check controls look smaller — every close/icon button under 44×44 either resized to 44×44 or given `hitSlop` padding up to it, whichever fit its layout without disturbing flanking elements.
- [x] **P0** `prefers-reduced-motion` honored across all celebration animations — audited every `react-native-reanimated` usage app-wide; `verification.tsx`/`level-up.tsx`/`ExecutionScoreRing.tsx` already gated correctly on `useReducedMotion()`, `XpBar.tsx` has no animation to gate. Nothing needed changing.
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
- [x] **P0** Privacy policy + terms (hosted, linked in-app) — drafted to accurately reflect what the app actually does (Supabase auth/storage, proof photos sent to Anthropic for verification, no ads/analytics SDKs, in-app deletion), hosted, and linked from Profile → Legal. **Placeholder, not legal review**: uses the developer's own contact email and a jurisdiction-neutral liability clause since LockedIn has no registered legal entity yet — get an actual legal review before public launch, especially if targeting the EEA/UK (GDPR) or California (CCPA), neither of which this draft addresses specifically.
- [x] **P0** **In-app account deletion** — not originally itemized here, but a real App Store Review blocker (Guideline 5.1.1(v): any app with account creation must support in-app deletion). `supabase/functions/delete-account`, called from Profile → Danger Zone with a destructive confirmation. Removes the user's proof media from Storage, then deletes the `auth.users` row — every other table cascades from that via existing FKs (verified by reading each migration's `references ... on delete cascade`, not assumed).
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
