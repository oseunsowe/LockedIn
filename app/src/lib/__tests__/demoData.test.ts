import {
  demoAchievements,
  demoActiveMissions,
  demoMissionHistory,
  demoProfileStats,
  demoProgressStats,
  demoTodayStats,
} from '../demoData';
import { levelForXp } from '../leveling';

describe('demo data', () => {
  it('is deterministic per seed and differs across seeds', () => {
    expect(demoProfileStats(7)).toEqual(demoProfileStats(7));
    expect(demoProfileStats(7)).not.toEqual(demoProfileStats(8));
  });

  it('keeps the profile level consistent with its XP total', () => {
    for (const seed of [1, 42, 999, 123456]) {
      const stats = demoProfileStats(seed);
      expect(levelForXp(stats.xp_total)).toBe(stats.level);
    }
  });

  it('builds an active board with exactly one main quest', () => {
    for (const seed of [1, 5, 77]) {
      const missions = demoActiveMissions(seed);
      expect(missions.filter((m) => m.type === 'main')).toHaveLength(1);
      expect(missions.every((m) => m.status === 'active')).toBe(true);
    }
  });

  it('produces plausible stats, history, and achievements', () => {
    const stats = demoProgressStats(3);
    expect(stats.consistencyPct).toBeGreaterThanOrEqual(68);
    expect(stats.growthTrend.growthTrendPct).toBeGreaterThan(0);
    expect(demoMissionHistory(3).length).toBeGreaterThanOrEqual(14);
    expect(demoAchievements(3).some((a) => a.unlocked)).toBe(true);
    const today = demoTodayStats(3);
    expect(today.missionsDone).toBeLessThan(today.missionsTotal);
  });
});
