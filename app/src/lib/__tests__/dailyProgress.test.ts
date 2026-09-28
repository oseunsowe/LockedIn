import { computeDailyProgress } from '../dailyProgress';

const now = new Date(2026, 8, 28, 15, 0);
const at = (day: number, hour: number) => new Date(2026, 8, day, hour).toISOString();
const done = (day: number, hour: number) => ({
  status: 'completed',
  deadline: null,
  completed_at: at(day, hour),
});
const open = (deadline: string | null) => ({ status: 'active', deadline, completed_at: null });

describe('computeDailyProgress', () => {
  it('counts missions verified today and open missions due today', () => {
    const result = computeDailyProgress({
      now,
      history: [done(28, 9), done(28, 12), done(27, 20)],
      active: [open(at(28, 21)), open(at(29, 9))],
    });
    expect(result).toMatchObject({ doneToday: 2, totalToday: 3, percentToday: 67 });
  });

  it('treats an overdue open mission as today’s work', () => {
    const result = computeDailyProgress({ now, history: [], active: [open(at(26, 10))] });
    expect(result).toMatchObject({ doneToday: 0, totalToday: 1, percentToday: 0 });
  });

  it('ignores open missions with no deadline or a later deadline', () => {
    const result = computeDailyProgress({
      now,
      history: [],
      active: [open(null), open(at(30, 9))],
    });
    expect(result.totalToday).toBe(0);
  });

  it('reports null percent (not 0%) when nothing is due', () => {
    expect(computeDailyProgress({ now, history: [], active: [] }).percentToday).toBeNull();
  });

  it('counts the rolling 7-day verified total', () => {
    const result = computeDailyProgress({
      now,
      history: [done(28, 9), done(25, 9), done(22, 9), done(20, 9)],
      active: [],
    });
    expect(result.weekCompleted).toBe(3);
  });

  it('does not count recovery missions as completed', () => {
    const result = computeDailyProgress({
      now,
      history: [{ status: 'recovery', deadline: null, completed_at: at(28, 9) }],
      active: [],
    });
    expect(result.doneToday).toBe(0);
  });
});
