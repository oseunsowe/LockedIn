import { useLayoutEffect, useState } from 'react';

type Countdown = { label: string; overdue: boolean };

function formatClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** Reads the clock — kept out of render (called only from the effect below) since components/hooks
 * must be pure: `Date.now()` is impure and React (Compiler-era) lints against calling it inline
 * during render. */
function computeCountdown(deadline: string): Countdown {
  const remainingMs = new Date(deadline).getTime() - Date.now();
  return { label: formatClock(remainingMs), overdue: remainingMs <= 0 };
}

/**
 * A live HH:MM:SS countdown to `deadline`. Every tick re-derives the remaining time from
 * `Date.now()` vs. the absolute `deadline` timestamp — nothing here is a stored duration that
 * background/kill/reboot could lose or desync; the next tick after resume computes the correct
 * value from scratch. This is what TODO.md §7.3 means by "wall-clock derived, survives
 * background/kill/reboot" — there's no elapsed-time state to corrupt in the first place.
 * Returns `null` when there's no deadline to count down to.
 */
export function useCountdown(deadline: string | null): Countdown | null {
  const [state, setState] = useState<Countdown | null>(null);

  // useLayoutEffect (not useEffect) so the first real value lands before paint — otherwise the
  // `null` initial state would flash visibly for a frame even on missions that do have a deadline.
  // No-deadline missions never touch `setState` here at all — the `deadline ? state : null` return
  // below handles that case, rather than resetting state from inside the effect.
  useLayoutEffect(() => {
    if (!deadline) return;
    const tick = () => setState(computeCountdown(deadline));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return deadline ? state : null;
}
