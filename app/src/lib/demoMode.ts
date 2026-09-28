import { useSyncExternalStore } from 'react';

/**
 * Demo Mode — client-side only, for marketing screenshots and landing-page design. It swaps what
 * the screens *display* (profile stats, missions, insights inputs, achievements) for generated
 * data; it never writes anything to Supabase, so real XP, streaks, and quotas are untouched and
 * the server-side protections (RLS on xp_events, verify-proof) are not bypassed.
 *
 * Only available in dev builds, or in a build made with EXPO_PUBLIC_ENABLE_DEMO_MODE=true — a
 * production store build ships without the switch (the previous seeding tool was removed for the
 * same reason).
 */
export const DEMO_MODE_AVAILABLE = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true';

const STORAGE_KEY = 'lockedin.demoMode';

type DemoState = { enabled: boolean; seed: number };

function load(): DemoState {
  const fallback: DemoState = { enabled: false, seed: 1 };
  if (!DEMO_MODE_AVAILABLE) return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<DemoState>;
    return {
      enabled: parsed.enabled === true,
      seed: typeof parsed.seed === 'number' ? parsed.seed : 1,
    };
  } catch {
    return fallback;
  }
}

let state: DemoState = load();
const listeners = new Set<() => void>();

function commit(next: DemoState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Persistence is a convenience; the in-memory state still works without it.
  }
  listeners.forEach((listener) => listener());
}

export function getDemoState(): DemoState {
  return state;
}

export function setDemoEnabled(enabled: boolean) {
  if (!DEMO_MODE_AVAILABLE) return;
  commit({ ...state, enabled });
}

/** New random data set — every screen re-renders with a fresh, different-looking account. */
export function reshuffleDemoData() {
  if (!DEMO_MODE_AVAILABLE) return;
  commit({ enabled: true, seed: Math.floor(Math.random() * 1_000_000) + 1 });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useDemoMode(): DemoState {
  return useSyncExternalStore(subscribe, getDemoState, getDemoState);
}
