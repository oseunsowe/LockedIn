# LockedIn

LockedIn is a premium, gamified daily-mission and accountability app — think Apple Fitness meets Duolingo streaks meets RPG character progression, built around the idea of turning goals into missions with proof-based completion and AI verification.

## Repo contents

- [`TODO.md`](TODO.md) — **the execution plan.** Phased road to MVP with scope cuts, gates, risks and milestones. Start here.
- [`LockedIn.md`](LockedIn.md) — high-fidelity UI generation prompts for every screen (onboarding, dashboard, mission board, proof submission, AI verification, pricing, etc.) plus the global design direction. Spec authority for screens with no mockup.
- [`docs/DESIGN-SYSTEM.md`](docs/DESIGN-SYSTEM.md) — design philosophy, component intent, animation system and product rules. Token values in it are superseded by the brand board (see `TODO.md` §0).
- [`assets/`](assets) — brand board (palette, typography, logo lockups, app icon sizes) and onboarding mockups.

- [`app/`](app) — the LockedIn mobile app, scaffolded with [Expo](https://expo.dev) SDK 57 (React Native 0.86 + TypeScript).

## Brand

| Void      | Obsidian  | Electric  | Violet    | Iris      | Gold      | Pure      |
| --------- | --------- | --------- | --------- | --------- | --------- | --------- |
| `#050508` | `#0F0F1E` | `#6366F1` | `#8B5CF6` | `#A78BFA` | `#D4AF37` | `#FFFFFF` |

Outfit (display) · Inter (body) · JetBrains Mono (data labels)

## Status

Scaffolding stage — Expo/React Native app initialized, screens not yet built. See [`TODO.md`](TODO.md) for what's next.

## Developing in Codespaces

1. On GitHub, click **Code → Create codespace on main** (or `gh codespace create -r oseunsowe/LockedIn`).
2. The devcontainer installs dependencies automatically (`cd app && npm install`).
3. Run `npm start` inside `app/` to launch the Expo dev server, then scan the QR code with the Expo Go app on your phone, or press `w` to open it in a browser tab.
