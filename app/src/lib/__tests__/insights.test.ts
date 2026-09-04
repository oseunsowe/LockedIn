import { generateInsights, type InsightInput } from '../insights';
import type { Mission } from '../missions';

function makeMission(overrides: Partial<Mission> = {}): Mission {
  return {
    id: 'mission-1',
    user_id: 'user-1',
    campaign_key: null,
    type: 'side',
    title: 'Test mission',
    difficulty: 'standard',
    status: 'active',
    xp_reward: 100,
    proof_requirements: [],
    deadline: null,
    created_at: new Date().toISOString(),
    completed_at: null,
    ...overrides,
  };
}

function baseInput(overrides: Partial<InsightInput> = {}): InsightInput {
  return {
    streakCount: 0,
    consistencyPct: 0,
    completionRatePct: null,
    growthTrend: { thisWeekXp: 0, lastWeekXp: 0, growthTrendPct: null },
    activeMissions: [],
    ...overrides,
  };
}

describe('generateInsights', () => {
  it('returns nothing for a brand new user with no signal', () => {
    expect(generateInsights(baseInput())).toEqual([]);
  });

  it('flags an overdue active mission as a risk', () => {
    const overdue = makeMission({
      title: 'Ship the landing page',
      deadline: new Date(Date.now() - 60_000).toISOString(),
    });
    const insights = generateInsights(baseInput({ activeMissions: [overdue] }));
    expect(insights[0]).toMatchObject({ id: 'overdue', tone: 'warning' });
    expect(insights[0]!.message).toContain('Ship the landing page');
  });

  it('flags a mission due within 3 hours, but not one due later', () => {
    const dueSoon = makeMission({
      title: 'Due soon',
      deadline: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
    const dueLater = makeMission({
      title: 'Due later',
      deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
    });
    const soonOnly = generateInsights(baseInput({ activeMissions: [dueSoon] }));
    expect(soonOnly.some((i) => i.id === 'due-soon')).toBe(true);

    const laterOnly = generateInsights(baseInput({ activeMissions: [dueLater] }));
    expect(laterOnly.some((i) => i.id === 'due-soon')).toBe(false);
  });

  it('reports positive growth as consistency improving, not a bare percentage', () => {
    const insights = generateInsights(
      baseInput({ growthTrend: { thisWeekXp: 200, lastWeekXp: 100, growthTrendPct: 100 } }),
    );
    expect(insights.find((i) => i.id === 'growth-up')).toMatchObject({ tone: 'positive' });
  });

  it('softens negative growth — neutral tone, no shame language', () => {
    const insights = generateInsights(
      baseInput({ growthTrend: { thisWeekXp: 50, lastWeekXp: 100, growthTrendPct: -50 } }),
    );
    const dip = insights.find((i) => i.id === 'growth-down');
    expect(dip?.tone).toBe('neutral');
    expect(dip?.message.toLowerCase()).not.toMatch(/fail|broke|lost/);
  });

  it('does not report growth when there is no prior week to compare against', () => {
    const insights = generateInsights(baseInput()); // growthTrendPct is null by default
    expect(insights.some((i) => i.id === 'growth-up' || i.id === 'growth-down')).toBe(false);
  });

  it('celebrates a streak of 3+ days but stays quiet below that', () => {
    expect(generateInsights(baseInput({ streakCount: 5 })).some((i) => i.id === 'streak')).toBe(
      true,
    );
    expect(generateInsights(baseInput({ streakCount: 1 })).some((i) => i.id === 'streak')).toBe(
      false,
    );
  });

  it('surfaces a strong completion rate but not an undefined one', () => {
    expect(
      generateInsights(baseInput({ completionRatePct: 80 })).some((i) => i.id === 'completion'),
    ).toBe(true);
    expect(
      generateInsights(baseInput({ completionRatePct: null })).some((i) => i.id === 'completion'),
    ).toBe(false);
  });

  it('puts an overdue-mission risk before positive reinforcement', () => {
    const overdue = makeMission({ deadline: new Date(Date.now() - 60_000).toISOString() });
    const insights = generateInsights(
      baseInput({ activeMissions: [overdue], streakCount: 10, completionRatePct: 90 }),
    );
    expect(insights[0]!.tone).toBe('warning');
  });
});
