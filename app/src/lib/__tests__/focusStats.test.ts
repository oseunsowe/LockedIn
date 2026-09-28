import { computeFocusStats, formatFocusDuration } from '../focusStats';

describe('computeFocusStats', () => {
  const now = new Date(2026, 8, 25, 15, 0);
  const at = (day: number, hour: number) => new Date(2026, 8, day, hour).toISOString();

  it('sums the week and splits out today', () => {
    const stats = computeFocusStats(
      [
        { started_at: at(25, 9), duration_seconds: 1800 },
        { started_at: at(25, 13), duration_seconds: 600 },
        { started_at: at(23, 10), duration_seconds: 3600 },
      ],
      now,
    );
    expect(stats).toEqual({ weekSeconds: 6000, todaySeconds: 2400, sessions: 3 });
  });

  it('is all zeros with no sessions', () => {
    expect(computeFocusStats([], now)).toEqual({ weekSeconds: 0, todaySeconds: 0, sessions: 0 });
  });
});

describe('formatFocusDuration', () => {
  it('formats minutes and hours', () => {
    expect(formatFocusDuration(0)).toBe('0m');
    expect(formatFocusDuration(59)).toBe('0m');
    expect(formatFocusDuration(45 * 60)).toBe('45m');
    expect(formatFocusDuration(135 * 60)).toBe('2h 15m');
  });
});
