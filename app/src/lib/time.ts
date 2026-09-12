type RemainingParts =
  | { hasDeadline: false }
  | { hasDeadline: true; overdue: true }
  | { hasDeadline: true; overdue: false; amount: number; unit: 'm' | 'h' | 'd' };

/** Wall-clock derived (`Date.now()` at call time, not a stored countdown) — matches TODO.md
 * §7.3's "timer correctness" requirement that nothing here depends on an interval that stops
 * ticking when the app is backgrounded. The one place that buckets a deadline into
 * minutes/hours/days; `formatTimeRemaining` and `formatCountdownCompact` both read off of it so
 * the sentence and the Lock Dial's center readout can never drift apart. */
function remainingParts(deadline: string | null): RemainingParts {
  if (!deadline) return { hasDeadline: false };

  const diffMs = new Date(deadline).getTime() - Date.now();
  if (diffMs <= 0) return { hasDeadline: true, overdue: true };

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return { hasDeadline: true, overdue: false, amount: minutes, unit: 'm' };

  const hours = Math.round(minutes / 60);
  if (hours < 24) return { hasDeadline: true, overdue: false, amount: hours, unit: 'h' };

  const days = Math.round(hours / 24);
  return { hasDeadline: true, overdue: false, amount: days, unit: 'd' };
}

/**
 * Formats a mission `deadline` (or `null`) as the short "time remaining" label the mission card
 * and mission row need.
 */
export function formatTimeRemaining(deadline: string | null): string {
  const parts = remainingParts(deadline);
  if (!parts.hasDeadline) return 'No deadline';
  if (parts.overdue) return 'Overdue';
  return `${parts.amount}${parts.unit} left`;
}

/** The Lock Dial's center readout — the same thresholds as `formatTimeRemaining`, split into a
 * number and a unit so the dial can size them as two lines instead of parsing the sentence
 * back apart. */
export function formatCountdownCompact(deadline: string | null): { value: string; unit: string } {
  const parts = remainingParts(deadline);
  if (!parts.hasDeadline) return { value: '—', unit: 'no deadline' };
  if (parts.overdue) return { value: '!', unit: 'overdue' };
  return { value: String(parts.amount), unit: parts.unit };
}

/** True once a deadline is inside the "urgent" window (≤1h left, or already past) — layers the
 * Lock Dial's red pulse ring on top of its tier color without changing what that color means. */
export function isUrgent(deadline: string | null): boolean {
  if (!deadline) return false;
  const diffMs = new Date(deadline).getTime() - Date.now();
  return diffMs <= 60 * 60 * 1000;
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
