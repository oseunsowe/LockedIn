export type NotificationPrefs = {
  morningBrief: boolean;
  /** Local hour (0-23) the morning brief fires. */
  morningHour: number;
  deadlines: boolean;
  streakAtRisk: boolean;
  quietHoursEnabled: boolean;
  /** Local hours; the window may wrap midnight (e.g. 22 -> 7). */
  quietStartHour: number;
  quietEndHour: number;
};

export const defaultNotificationPrefs: NotificationPrefs = {
  morningBrief: true,
  morningHour: 8,
  deadlines: true,
  streakAtRisk: true,
  quietHoursEnabled: true,
  quietStartHour: 22,
  quietEndHour: 7,
};

export type PlannedNotification = {
  id: string;
  kind: 'morning' | 'deadline' | 'streak';
  title: string;
  body: string;
  fireAt: Date;
};

export type PlanInput = {
  prefs: NotificationPrefs;
  missions: { id: string; title: string; deadline: string | null }[];
  streakCount: number;
  /** Local calendar date ('YYYY-MM-DD') of the last verified mission, or null. */
  lastStreakDate: string | null;
  now: Date;
};

const HOUR = 60 * 60 * 1000;
/** iOS caps pending local notifications at 64 — stay well under it. */
const MAX_PLANNED = 30;

export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isInQuietHours(date: Date, prefs: NotificationPrefs): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const { quietStartHour: start, quietEndHour: end } = prefs;
  if (start === end) return false;
  const hour = date.getHours();
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/** Pushes a time that lands in quiet hours forward to the moment quiet hours end. */
export function respectQuietHours(date: Date, prefs: NotificationPrefs): Date {
  if (!isInQuietHours(date, prefs)) return date;
  const shifted = new Date(date);
  shifted.setHours(prefs.quietEndHour, 0, 0, 0);
  if (shifted <= date) shifted.setDate(shifted.getDate() + 1);
  return shifted;
}

function atHour(base: Date, dayOffset: number, hour: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/**
 * Decides which local notifications should exist right now. Pure and deterministic so it can be
 * unit-tested; the scheduler simply cancels everything and re-schedules this list on every change.
 */
export function planNotifications(input: PlanInput): PlannedNotification[] {
  const { prefs, missions, streakCount, lastStreakDate, now } = input;
  const planned: PlannedNotification[] = [];
  const openMissions = missions.filter((m) => m.deadline === null || new Date(m.deadline) > now);

  if (prefs.morningBrief) {
    for (let day = 0; day < 3; day++) {
      const fireAt = respectQuietHours(atHour(now, day, prefs.morningHour), prefs);
      if (fireAt <= now) continue;
      const count = openMissions.length;
      planned.push({
        id: `morning-${localDateKey(fireAt)}`,
        kind: 'morning',
        title: 'Today’s mission is ready',
        body:
          day === 0 && count > 0
            ? `You have ${count} mission${count === 1 ? '' : 's'} lined up. Start with the Main Quest.`
            : 'One clear challenge, one verified win. Open LockedIn to start.',
        fireAt,
      });
    }
  }

  if (prefs.deadlines) {
    for (const mission of openMissions) {
      if (!mission.deadline) continue;
      const deadline = new Date(mission.deadline);
      const fireAt = respectQuietHours(new Date(deadline.getTime() - HOUR), prefs);
      // Skip if the (possibly shifted) reminder would land after the deadline itself.
      if (fireAt <= now || fireAt >= deadline) continue;
      planned.push({
        id: `deadline-${mission.id}`,
        kind: 'deadline',
        title: 'Due within the hour',
        body: `“${mission.title}” is almost due. Submit proof to lock in the win.`,
        fireAt,
      });
    }
  }

  if (prefs.streakAtRisk && streakCount > 0) {
    const today = localDateKey(now);
    const doneToday = lastStreakDate === today;
    // Tonight at 8 PM if today's mission isn't verified yet; otherwise tomorrow night.
    let fireAt = atHour(now, doneToday ? 1 : 0, 20);
    if (fireAt <= now) fireAt = atHour(now, 1, 20);
    fireAt = respectQuietHours(fireAt, prefs);
    planned.push({
      id: `streak-${localDateKey(fireAt)}`,
      kind: 'streak',
      title: `Your ${streakCount}-day streak is on the line`,
      body: 'One verified mission tonight keeps it alive.',
      fireAt,
    });
  }

  return planned.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, MAX_PLANNED);
}
