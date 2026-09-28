import type { MissionDifficulty } from '@/lib/database.types';

/**
 * A starting XP suggestion for manually-created missions, scaled to difficulty — NOT the
 * profile-level XP curve (TODO.md §4.2/§9 deliberately leaves that undesigned). This is a much
 * smaller, self-contained decision: what to default a single mission's reward slider to. The user
 * can adjust it before submitting (§7.2's "reward" stepper).
 */
export const defaultXpForDifficulty: Record<MissionDifficulty, number> = {
  standard: 100,
  challenging: 250,
  hard: 500,
  epic: 1000,
};

/** Highest reward a mission of this difficulty can pay out: 1.5x the default. Mirrors XP_CAP_BY_DIFFICULTY
 * in supabase/functions/verify-proof (the server clamps to this regardless of what the client sends). */
export const maxXpForDifficulty: Record<MissionDifficulty, number> = {
  standard: 150,
  challenging: 375,
  hard: 750,
  epic: 1500,
};
