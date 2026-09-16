/**
 * Formats a mission `deadline` (or `null`) as the short "time remaining" label the mission card
 * and mission row need. Wall-clock derived (`Date.now()` at call time, not a stored countdown) —
 * matches TODO.md §7.3's "timer correctness" requirement that nothing here depends on an interval
 * that stops ticking when the app is backgrounded.
 */
export function formatTimeRemaining(deadline: string | null): string {
  if (!deadline) return 'No deadline';

  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return 'Overdue';

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m left`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h left`;

  const days = Math.round(hours / 24);
  return `${days}d left`;
}

/**
 * "Time elapsed" toward a mission's deadline — `(now - created_at) / (deadline - created_at)`,
 * clamped to [0, 100]. This is deliberately labeled "time elapsed," not "mission progress": there
 * is no task-completion column anywhere in the schema (a mission is `active` until it flips to
 * `completed`/`failed`/`recovery` — see supabase/migrations), so a completion percentage would
 * have to be invented. How much of the allotted time has passed is a real, honestly-derivable
 * number instead. Returns `null` when there's no deadline (nothing to measure elapsed-time against).
 */
export function computeElapsedProgress(createdAt: string, deadline: string | null): number | null {
  if (!deadline) return null;

  const start = new Date(createdAt).getTime();
  const end = new Date(deadline).getTime();
  if (end <= start) return 100;

  const pct = ((Date.now() - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, pct));
}

/** An ISO timestamp `hours` from now — e.g. a fresh deadline for a resumed Recovery Mode mission.
 * A plain module-level function, not inlined at the call site: the `Date.now()`/`new Date()` call
 * it wraps is impure, and React's purity lint flags that lexically anywhere inside a component
 * body (even inside an event handler closure) — calling out to a function like this one is how the
 * rest of this file already avoids that (`formatTimeRemaining`, `computeElapsedProgress`). */
export function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
