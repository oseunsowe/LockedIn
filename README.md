# LockedIn

LockedIn is a premium, gamified daily-mission and accountability app — think Apple Fitness meets Duolingo streaks meets RPG character progression, built around the idea of turning goals into missions with proof-based completion and AI verification.

## Repo contents

- [`LockedIn.md`](LockedIn.md) — high-fidelity UI generation prompts for every screen (onboarding, dashboard, mission board, proof submission, AI verification, pricing, etc.) plus the global design direction.
- [`todo.md`](todo.md) — design system notes: design tokens (colors, typography), core components (mission card, XP ring, avatar, AI companion, achievement badges), animation system, screen architecture, and recommended build order.
- [`assets/`](assets) — reference screenshots and onboarding mockups.

- [`app/`](app) — the LockedIn mobile app, scaffolded with [Expo](https://expo.dev) (React Native + TypeScript).

## Status

Scaffolding stage — Expo/React Native app initialized, screens not yet built.

## Developing in Codespaces

1. On GitHub, click **Code → Create codespace on main** (or `gh codespace create -r oseunsowe/LockedIn`).
2. The devcontainer installs dependencies automatically (`cd app && npm install`).
3. Run `npm start` inside `app/` to launch the Expo dev server, then scan the QR code with the Expo Go app on your phone, or press `w` to open it in a browser tab.
