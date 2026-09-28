import {
  defaultNotificationPrefs,
  isInQuietHours,
  planNotifications,
  respectQuietHours,
  type NotificationPrefs,
} from '../notificationPlan';

const prefs: NotificationPrefs = { ...defaultNotificationPrefs };
const at = (iso: string) => new Date(iso);
// Local-time constructors keep these tests timezone-independent.
const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

describe('quiet hours', () => {
  it('handles a window that wraps midnight', () => {
    expect(isInQuietHours(local(2026, 9, 25, 23), prefs)).toBe(true);
    expect(isInQuietHours(local(2026, 9, 25, 3), prefs)).toBe(true);
    expect(isInQuietHours(local(2026, 9, 25, 12), prefs)).toBe(false);
  });

  it('pushes a quiet-hours time forward to when quiet hours end', () => {
    const shifted = respectQuietHours(local(2026, 9, 25, 23, 30), prefs);
    expect(shifted).toEqual(local(2026, 9, 26, 7));
    expect(respectQuietHours(local(2026, 9, 25, 3), prefs)).toEqual(local(2026, 9, 25, 7));
  });

  it('does nothing when disabled', () => {
    const off = { ...prefs, quietHoursEnabled: false };
    expect(isInQuietHours(local(2026, 9, 25, 23), off)).toBe(false);
  });
});

describe('planNotifications', () => {
  const base = {
    prefs,
    missions: [] as { id: string; title: string; deadline: string | null }[],
    streakCount: 0,
    lastStreakDate: null,
  };

  it('schedules the next three morning briefs', () => {
    const plan = planNotifications({ ...base, now: local(2026, 9, 25, 6) });
    const morning = plan.filter((p) => p.kind === 'morning');
    expect(morning).toHaveLength(3);
    expect(morning[0]!.fireAt).toEqual(local(2026, 9, 25, 8));
  });

  it('skips a morning brief that has already passed today', () => {
    const plan = planNotifications({ ...base, now: local(2026, 9, 25, 10) });
    expect(plan.filter((p) => p.kind === 'morning')).toHaveLength(2);
  });

  it('reminds an hour before each deadline and skips past ones', () => {
    const now = local(2026, 9, 25, 12);
    const plan = planNotifications({
      ...base,
      now,
      missions: [
        { id: 'a', title: 'Ship it', deadline: local(2026, 9, 25, 18).toISOString() },
        { id: 'b', title: 'Old', deadline: local(2026, 9, 25, 9).toISOString() },
      ],
    });
    const deadlines = plan.filter((p) => p.kind === 'deadline');
    expect(deadlines).toHaveLength(1);
    expect(deadlines[0]!.fireAt).toEqual(local(2026, 9, 25, 17));
  });

  it('warns about the streak tonight when today is not done yet', () => {
    const plan = planNotifications({
      ...base,
      now: local(2026, 9, 25, 12),
      streakCount: 12,
      lastStreakDate: '2026-09-24',
    });
    const streak = plan.find((p) => p.kind === 'streak')!;
    expect(streak.fireAt).toEqual(local(2026, 9, 25, 20));
    expect(streak.title).toContain('12-day');
  });

  it('moves the streak warning to tomorrow once today is verified', () => {
    const plan = planNotifications({
      ...base,
      now: local(2026, 9, 25, 12),
      streakCount: 12,
      lastStreakDate: '2026-09-25',
    });
    expect(plan.find((p) => p.kind === 'streak')!.fireAt).toEqual(local(2026, 9, 26, 20));
  });

  it('respects per-type switches', () => {
    const plan = planNotifications({
      ...base,
      prefs: { ...prefs, morningBrief: false, deadlines: false, streakAtRisk: false },
      now: local(2026, 9, 25, 6),
      streakCount: 5,
      missions: [{ id: 'a', title: 'x', deadline: at('2027-01-01T00:00:00Z').toISOString() }],
    });
    expect(plan).toEqual([]);
  });

  it('never schedules anything inside quiet hours', () => {
    const plan = planNotifications({
      ...base,
      prefs: { ...prefs, quietStartHour: 18, quietEndHour: 9 },
      now: local(2026, 9, 25, 6),
      streakCount: 3,
      missions: [{ id: 'a', title: 'x', deadline: local(2026, 9, 25, 20).toISOString() }],
    });
    for (const item of plan) {
      expect(isInQuietHours(item.fireAt, { ...prefs, quietStartHour: 18, quietEndHour: 9 })).toBe(
        false,
      );
    }
  });
});
