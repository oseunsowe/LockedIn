/**
 * The XP curve (TODO.md §9 P0: "tune the early curve so levels 1-5 come fast (retention) and
 * later levels earn meaning"). This is the reference implementation — `profiles.level` is derived
 * server-side from the byte-identical precomputed table in
 * supabase/migrations/20260901000009_level_curve.sql, generated FROM this exact formula (not
 * reimplemented independently in SQL), so client and server can never disagree on a rounding edge
 * case. If this formula ever changes, regenerate that migration's table from it.
 *
 * The XP required to go from level N to N+1 is `round(100 * N^1.5)` — a power curve, so the
 * increment itself grows with level: 100 XP for 1->2 (one verified mission), ~3,162 for 10->11,
 * ~35,355 for 50->51.
 */
const BASE_XP = 100;
const CURVE_EXPONENT = 1.5;
const MAX_LEVEL = 100;

function xpToNext(level: number): number {
  return Math.round(BASE_XP * Math.pow(level, CURVE_EXPONENT));
}

/** `cumulativeXpForLevel[n - 1]` = total XP needed to REACH level `n` (level 1 = 0 XP). */
const cumulativeXpForLevel: number[] = [0];
for (let level = 1; level < MAX_LEVEL; level++) {
  cumulativeXpForLevel.push(cumulativeXpForLevel[level - 1]! + xpToNext(level));
}

function clampLevel(level: number): number {
  return Math.min(Math.max(level, 1), MAX_LEVEL);
}

/** Cumulative XP required to reach `level`. Clamps to the curve's [1, 100] range. */
export function xpForLevel(level: number): number {
  return cumulativeXpForLevel[clampLevel(level) - 1]!;
}

/** Total lifetime XP -> current level (mirrors `level_for_xp()` in the migration). */
export function levelForXp(totalXp: number): number {
  let level = 1;
  for (let i = 1; i < cumulativeXpForLevel.length; i++) {
    if (totalXp >= cumulativeXpForLevel[i]!) level = i + 1;
    else break;
  }
  return level;
}

export type LevelProgress = {
  level: number;
  /** XP earned within the current level (0 at the moment of leveling up). */
  xpIntoLevel: number;
  /** Total XP needed to go from this level to the next. */
  xpForNextLevel: number;
  /** 0-1, for a progress bar. `1` once `MAX_LEVEL` is reached (no further "next"). */
  progress: number;
};

/** Everything the dashboard's XP bar needs, derived from `profiles.xp_total`. */
export function levelProgress(totalXp: number): LevelProgress {
  const level = levelForXp(totalXp);
  if (level >= MAX_LEVEL) {
    return { level, xpIntoLevel: 0, xpForNextLevel: 0, progress: 1 };
  }
  const currentThreshold = xpForLevel(level);
  const nextThreshold = xpForLevel(level + 1);
  const xpIntoLevel = totalXp - currentThreshold;
  const xpForNextLevel = nextThreshold - currentThreshold;
  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progress: xpForNextLevel > 0 ? Math.min(1, xpIntoLevel / xpForNextLevel) : 1,
  };
}
