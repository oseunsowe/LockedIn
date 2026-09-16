import { levelForXp, levelProgress, xpForLevel } from '../leveling';

// Mirrors supabase/migrations/20260901000009_level_curve.sql's `level_thresholds` table exactly —
// both were generated from the same formula run. If this test ever fails after editing the curve
// in leveling.ts, the migration's precomputed table must be regenerated to match, not the other
// way around; see that migration's comment.
const KNOWN_THRESHOLDS: [level: number, cumulativeXp: number][] = [
  [1, 0],
  [2, 100],
  [3, 383],
  [4, 903],
  [5, 1703],
  [10, 11106],
  [20, 67135],
  [25, 118809],
  [50, 689513],
  [75, 1916187],
  [100, 3950120],
];

describe('xpForLevel', () => {
  it.each(KNOWN_THRESHOLDS)('level %i requires %i cumulative XP', (level, cumulativeXp) => {
    expect(xpForLevel(level)).toBe(cumulativeXp);
  });

  it('clamps below level 1', () => {
    expect(xpForLevel(0)).toBe(xpForLevel(1));
  });

  it('clamps above the level 100 ceiling', () => {
    expect(xpForLevel(150)).toBe(xpForLevel(100));
  });
});

describe('levelForXp', () => {
  it('is the inverse of xpForLevel at each threshold', () => {
    for (const [level, cumulativeXp] of KNOWN_THRESHOLDS) {
      expect(levelForXp(cumulativeXp)).toBe(level);
    }
  });

  it('does not credit a level until its full threshold is met', () => {
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(382)).toBe(2);
    expect(levelForXp(383)).toBe(3);
  });

  it('a brand new user (0 XP) is level 1', () => {
    expect(levelForXp(0)).toBe(1);
  });
});

describe('levelProgress', () => {
  it('reports 0 progress the instant a level is reached', () => {
    const progress = levelProgress(100);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(0);
    expect(progress.progress).toBe(0);
  });

  it('reports partial progress toward the next level', () => {
    // Level 2 spans [100, 383) — 141 XP in is roughly the midpoint of that 283-XP span.
    const progress = levelProgress(241);
    expect(progress.level).toBe(2);
    expect(progress.xpIntoLevel).toBe(141);
    expect(progress.xpForNextLevel).toBe(283);
    expect(progress.progress).toBeCloseTo(141 / 283, 5);
  });

  it('caps at 100% progress once the level-100 ceiling is hit', () => {
    const progress = levelProgress(10_000_000);
    expect(progress.level).toBe(100);
    expect(progress.progress).toBe(1);
  });
});
