import { computeCompletionRate, computeConsistency, computeGrowthTrend } from '../progressStats';

const NOW = new Date('2026-09-15T12:00:00.000Z');

function daysAgoIso(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe('computeConsistency', () => {
  it('is 0 with no events', () => {
    expect(computeConsistency([], 30, NOW)).toBe(0);
  });

  it('is 100 when every day in the window has an event', () => {
    const dates = Array.from({ length: 30 }, (_, i) => daysAgoIso(i));
    expect(computeConsistency(dates, 30, NOW)).toBe(100);
  });

  it('counts distinct days, not distinct events', () => {
    // 3 events on "today," none on any other day, in a 30-day window.
    const dates = [daysAgoIso(0), daysAgoIso(0), daysAgoIso(0)];
    expect(computeConsistency(dates, 30, NOW)).toBe(Math.round((1 / 30) * 100));
  });

  it('ignores events outside the window', () => {
    const dates = [daysAgoIso(0), daysAgoIso(45)];
    expect(computeConsistency(dates, 30, NOW)).toBe(Math.round((1 / 30) * 100));
  });
});

describe('computeCompletionRate', () => {
  it('returns null when there are no terminal missions', () => {
    expect(computeCompletionRate(['active', 'active'])).toBeNull();
  });

  it('excludes still-active missions from the denominator', () => {
    // 2 completed out of 3 terminal (1 failed) — the 2 active missions don't count either way.
    expect(computeCompletionRate(['completed', 'completed', 'failed', 'active', 'active'])).toBe(
      Math.round((2 / 3) * 100),
    );
  });

  it('is 100 when every terminal mission completed', () => {
    expect(computeCompletionRate(['completed', 'completed'])).toBe(100);
  });

  it('is 0 when every terminal mission was recovery/failed', () => {
    expect(computeCompletionRate(['failed', 'recovery'])).toBe(0);
  });
});

describe('computeGrowthTrend', () => {
  it('reports null growth (not 0 or Infinity) when last week had no XP', () => {
    const events = [{ amount: 100, created_at: daysAgoIso(1) }];
    const trend = computeGrowthTrend(events, NOW);
    expect(trend.thisWeekXp).toBe(100);
    expect(trend.lastWeekXp).toBe(0);
    expect(trend.growthTrendPct).toBeNull();
  });

  it('computes a positive percentage change', () => {
    const events = [
      { amount: 200, created_at: daysAgoIso(1) }, // this week
      { amount: 100, created_at: daysAgoIso(9) }, // last week
    ];
    const trend = computeGrowthTrend(events, NOW);
    expect(trend.thisWeekXp).toBe(200);
    expect(trend.lastWeekXp).toBe(100);
    expect(trend.growthTrendPct).toBe(100);
  });

  it('computes a negative percentage change', () => {
    const events = [
      { amount: 50, created_at: daysAgoIso(1) },
      { amount: 100, created_at: daysAgoIso(9) },
    ];
    const trend = computeGrowthTrend(events, NOW);
    expect(trend.growthTrendPct).toBe(-50);
  });

  it('excludes events older than the two-week comparison window', () => {
    const events = [
      { amount: 100, created_at: daysAgoIso(1) },
      { amount: 999, created_at: daysAgoIso(30) },
    ];
    const trend = computeGrowthTrend(events, NOW);
    expect(trend.thisWeekXp).toBe(100);
    expect(trend.lastWeekXp).toBe(0);
  });
});
