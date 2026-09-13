# Design Brief / Prompt — Lockedinmission.app Landing Page (Waitlist)

*Use this as-is with a UX/UI designer, a design agency, or an AI design/coding tool (e.g., Claude Code, v0, Figma AI, Cursor). It is written to be handed off directly.*

---

## 1. Project Context

You are the UX/UI designer responsible for the public marketing/waitlist landing page for **Lockedinmission.app**, a gamified accountability and goal-commitment app. The app's product design has recently been updated in the codebase, but the **public landing page has not been synced with it** and currently has visible bugs, misaligned assets, and outdated visuals.

Your task is to bring the landing page fully up to date with the current product design, fix all existing defects, and elevate the page's visual quality to sit above the closest competitor reference site, **Forfeit.app** — without copying it.

## 2. Objective

Rebuild and polish the Lockedinmission.app landing page so that it:

1. Reflects the **latest UI/UX design** already implemented in the app codebase (colors, typography, components, iconography, motion language).
2. Uses **Forfeit.app as a competitive reference point only** — matching its clarity and conversion-focused structure, but distinct in visual identity, more premium in execution, and reinforcing the *gamified* nature of Lockedinmission (progress bars, streaks, XP/levels, rewards, stakes/consequences — whatever mechanics the app actually uses).
3. Is **bug-free**, with every form, button, link, and interactive element working and validated.
4. Displays app screenshots in **iPhone 17 Pro mockup frames**, correctly cropped and centered inside the device bezel with no overflow, stretching, or misalignment.
5. Uses **new, higher-quality imagery** wherever current visuals are low-resolution, generic, or inconsistent with the app's design system.

## 3. Source of Truth

- Pull all colors, type scale, spacing, component styles, and iconography **directly from the current app codebase** — not from memory, an old style guide, or the existing landing page. If the codebase and the live landing page conflict, the codebase wins.
- Audit every screen/component currently used in in-app screenshots and confirm you're using the **latest version** of each screen, not a stale or deprecated one.

## 4. Competitive Reference: Forfeit.app

- Study Forfeit.app's landing page structure: hero framing, how it explains its core mechanic, social proof placement, CTA repetition, and mobile mockup presentation.
- Do **not** replicate its layout 1:1, its exact copy, its illustration style, or its color palette.
- Differentiate and improve by:
  - Leaning harder into **gamification** in the visual language: visible streaks, levels/XP, badges, leaderboards, stakes/wagers, or countdown mechanics — whatever is core to Lockedinmission's actual gameplay loop.
  - Using motion/micro-interactions (scroll-triggered reveals, animated counters, progress-bar fills) to make the mechanic feel alive, not static.
  - Producing a more premium visual execution: refined type pairing, consistent 8pt spacing grid, higher-fidelity mockups, and cohesive color system (do not just reuse Forfeit's palette in different shades).

## 5. Device Mockup Requirements

- All app screenshots must be placed inside an **iPhone 17 Pro** device frame (correct bezel, dynamic island, corner radius, and titanium frame proportions for that model — not an older iPhone frame relabeled).
- Screenshots inside every mockup must be:
  - Cropped to the exact screen safe area of the frame (no black bars, no stretching, no squeezed/distorted UI).
  - Centered and scaled consistently across all mockups on the page (no mockup showing a smaller or off-center screenshot next to others that are correctly sized).
  - Status bar, notch/dynamic island, and rounded corners of the screenshot itself should be masked to match the device frame — the screenshot should look "installed" in the phone, not pasted on top of it.
- Where multiple screens are shown side-by-side (e.g., a feature carousel or 3-phone hero layout), ensure consistent scale, vertical alignment, and spacing between frames.

## 6. Bug & QA Checklist

Audit and fix the entire landing page, including but not limited to:

- **Forms:** waitlist signup form — validate email format, show clear inline error and success states, confirm the submit action actually fires and stores/sends the entry, fix any broken required-field validation or silent failures.
- **Layout bugs:** any overlapping elements, broken responsive breakpoints (mobile/tablet/desktop), inconsistent margins/padding, elements that shift on load (layout jank/CLS).
- **Broken or dead links/buttons:** every CTA, nav link, footer link, and social icon must go to a working, correct destination.
- **Image issues:** low-res, pixelated, or wrongly-cropped images; screenshots inside phone mockups that are misaligned, overflowing, or scaled inconsistently (see Section 5).
- **Typography bugs:** inconsistent font weights/sizes vs. the codebase's type scale, orphaned text, truncated copy.
- **Cross-browser/device check:** verify on latest Chrome, Safari, and mobile Safari/Chrome at minimum.
- **Accessibility basics:** sufficient color contrast, alt text on images, focus states on interactive elements, keyboard navigability of the form.

## 7. Screen Review

- Review every product screen currently featured on the landing page against the live app/codebase.
- Confirm each screen shown is: (a) the current version of that screen, (b) representative of a real, compelling app moment (not a placeholder or empty state unless intentionally used), and (c) properly aligned/cropped per Section 5.
- Replace any screen that is outdated, low-quality, or no longer reflects the app's actual flow.

## 8. New Imagery

- Where existing assets (hero image, background textures, icon sets, illustrations, OG/social preview image) are outdated or weak, generate or source new imagery that:
  - Matches the app's current visual identity and color system.
  - Reinforces the gamified positioning (energetic, competitive, reward-driven tone — avoid generic "productivity app" stock-photo aesthetics).
  - Is high resolution and optimized for web (appropriately compressed, correct formats — WebP/AVIF with fallbacks).

## 9. Deliverables

1. Updated landing page (code or Figma file, matching your team's workflow) reflecting all sections above.
2. Before/after screenshots or a short Loom-style walkthrough highlighting what was fixed.
3. A short QA log listing each bug found and how it was resolved.
4. Exported new image/icon assets (source files + optimized web exports).

## 10. Acceptance Criteria

- [ ] Landing page visually matches the current app codebase's design system (colors, type, components).
- [ ] Positioned as clearly more premium and more gamified than Forfeit.app, with no copied layout, copy, or visual style.
- [ ] All app screenshots sit correctly inside iPhone 17 Pro mockups — no misalignment, stretching, or inconsistent scale anywhere on the page.
- [ ] Waitlist form fully functional with proper validation and success/error states.
- [ ] Zero broken links, zero layout bugs, verified across desktop and mobile breakpoints.
- [ ] All imagery is current, on-brand, and high resolution.
