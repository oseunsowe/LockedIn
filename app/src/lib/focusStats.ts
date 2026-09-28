export type FocusStats = {
  /** Total focused seconds over the last 7 days. */
  weekSeconds: number;
  /** Total focused seconds since local midnight. */
  todaySeconds: number;
  sessions: number;
};

/**
 * Aggregates saved Focus Mode sessions. Focus time is self-reported (the timer on Active Mission
 * Mode), so it is shown as a personal stat only - it never feeds XP, streaks, or achievements.
 */
export function computeFocusStats(
  sessions: { started_at: string; duration_seconds: number }[],
  now: Date = new Date(),
): FocusStats {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  let weekSeconds = 0;
  let todaySeconds = 0;
  for (const session of sessions) {
    weekSeconds += session.duration_seconds;
    if (new Date(session.started_at).getTime() >= startOfToday) {
      todaySeconds += session.duration_seconds;
    }
  }
  return { weekSeconds, todaySeconds, sessions: sessions.length };
}

/** "2h 15m" / "45m" / "0m" - minutes are floored, hours only shown once there is at least one. */
export function formatFocusDuration(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}
