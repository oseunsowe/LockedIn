type ProgressMission = {
  status: string;
  deadline: string | null;
  completed_at: string | null;
};

export type DailyProgress = {
  /** Missions verified today. */
  doneToday: number;
  /** Verified today + still-open missions due by the end of today (overdue included). */
  totalToday: number;
  /** 0-100, or `null` when nothing is due today (avoid a fake "0%"). */
  percentToday: number | null;
  /** Missions verified in the last 7 days. */
  weekCompleted: number;
};

function startOfDay(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/**
 * Today's command-center numbers from real mission data (no invented values). "Today" is the
 * device's local calendar day. A mission counts toward today's total if it was verified today, or
 * is still open and due by the end of today (a missed deadline is still today's work).
 */
export function computeDailyProgress(input: {
  active: ProgressMission[];
  history: ProgressMission[];
  now?: Date;
}): DailyProgress {
  const now = input.now ?? new Date();
  const dayStart = startOfDay(now);
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const weekStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;

  let doneToday = 0;
  let weekCompleted = 0;
  for (const mission of input.history) {
    if (mission.status !== 'completed' || !mission.completed_at) continue;
    const completedAt = new Date(mission.completed_at).getTime();
    if (completedAt >= dayStart && completedAt < dayEnd) doneToday++;
    if (completedAt >= weekStart && completedAt <= now.getTime()) weekCompleted++;
  }

  const dueToday = input.active.filter(
    (mission) =>
      mission.status === 'active' &&
      mission.deadline !== null &&
      new Date(mission.deadline).getTime() < dayEnd,
  ).length;

  const totalToday = doneToday + dueToday;
  return {
    doneToday,
    totalToday,
    percentToday: totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : null,
    weekCompleted,
  };
}
