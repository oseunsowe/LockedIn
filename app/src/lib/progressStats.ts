/**
 * Progress Profile stats (TODO.md §11, `LockedIn.md` Screen 13: "Consistency · Focus · Completion
 * rate · Growth trends"). Pure functions over raw rows so they're testable without a database —
 * the hook that fetches those rows lives in `src/hooks/useProgressStats.ts`.
 *
 * "Focus" is deliberately not implemented here — see TODO.md §11 for why: Focus Mode
 * (`app/(modals)/active-mission.tsx`) is a client-only toggle, never persisted anywhere, so there
 * is no real data to compute a "focus score" from. Shipping a number for it would be fabricated.
 *
 * Day boundaries here are plain UTC-calendar-day comparisons, not the timezone-correct boundary
 * `record_mission_completion_streak()` uses for streaks (supabase/migrations/20260901000010_
 * streaks.sql) — that precision matters for a once-a-day streak count; it's overkill for a rolling
 * 30-day consistency percentage, so this stays simple rather than duplicating that machinery.
 */

function toUtcDateKey(iso: string): string {
  return iso.slice(0, 10); // "YYYY-MM-DD" - safe on any ISO 8601 timestamp string.
}

/** % of the last `windowDays` (default 30) calendar days that had at least one XP-earning event. */
export function computeConsistency(
  xpEventDates: string[],
  windowDays = 30,
  now: Date = new Date(),
): number {
  if (windowDays <= 0) return 0;

  const windowStart = new Date(now.getTime() - (windowDays - 1) * 24 * 60 * 60 * 1000);
  const startKey = toUtcDateKey(windowStart.toISOString());
  const endKey = toUtcDateKey(now.toISOString());

  const activeDays = new Set(
    xpEventDates.map(toUtcDateKey).filter((key) => key >= startKey && key <= endKey),
  );

  return Math.round((activeDays.size / windowDays) * 100);
}

/**
 * Completed / (completed + failed + recovery) — missions still `active` haven't reached an
 * outcome yet, so they're excluded rather than counted as pending failures. `null` (not `0`) when
 * there's no terminal mission yet, so the UI can show "not enough data" instead of a misleading 0%.
 */
export function computeCompletionRate(
  missionStatuses: ('active' | 'completed' | 'failed' | 'recovery')[],
): number | null {
  const terminal = missionStatuses.filter((status) => status !== 'active');
  if (terminal.length === 0) return null;

  const completed = terminal.filter((status) => status === 'completed').length;
  return Math.round((completed / terminal.length) * 100);
}

export type GrowthTrend = {
  thisWeekXp: number;
  lastWeekXp: number;
  /** `null` when last week had 0 XP — a percentage change against zero is undefined, not "∞%" or
   * "0%". The UI falls back to showing the raw XP figures in that case. */
  growthTrendPct: number | null;
};

/** This week's XP vs. the 7 days before that, both rolling windows ending "now." */
export function computeGrowthTrend(
  xpEvents: { amount: number; created_at: string }[],
  now: Date = new Date(),
): GrowthTrend {
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const thisWeekStart = now.getTime() - oneWeekMs;
  const lastWeekStart = now.getTime() - 2 * oneWeekMs;

  let thisWeekXp = 0;
  let lastWeekXp = 0;
  for (const event of xpEvents) {
    const timestamp = new Date(event.created_at).getTime();
    if (timestamp >= thisWeekStart && timestamp <= now.getTime()) {
      thisWeekXp += event.amount;
    } else if (timestamp >= lastWeekStart && timestamp < thisWeekStart) {
      lastWeekXp += event.amount;
    }
  }

  const growthTrendPct =
    lastWeekXp > 0 ? Math.round(((thisWeekXp - lastWeekXp) / lastWeekXp) * 100) : null;

  return { thisWeekXp, lastWeekXp, growthTrendPct };
}
