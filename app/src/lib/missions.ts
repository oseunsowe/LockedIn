import type { Database, Json, MissionDifficulty, ProofType } from './database.types';
import { type IconName, palette, tierRing } from '@/theme';

export type Mission = Database['public']['Tables']['missions']['Row'];

export const allProofTypes: ProofType[] = ['photo', 'screenshot', 'voice', 'file'];

/** `proof_requirements` -> the icon registry name used to render its chip (§theme/icons.tsx). */
export const proofTypeIcon: Record<ProofType, IconName> = {
  photo: 'camera',
  screenshot: 'screenshot',
  voice: 'voice',
  file: 'file',
};

export const proofTypeLabel: Record<ProofType, string> = {
  photo: 'Photo',
  screenshot: 'Screenshot',
  voice: 'Voice',
  file: 'File',
};

function isProofType(value: unknown): value is ProofType {
  return value === 'photo' || value === 'screenshot' || value === 'voice' || value === 'file';
}

/**
 * Difficulty scale (TODO.md §7.1: "with visual weight, not just a label"). `weight` drives
 * `DifficultyMeter`'s filled-bar count; `color` reuses the same tier-progression language as
 * `theme/colors.ts`'s `tierRing` (steel → electric → violet → gold) so "harder" reads as "more
 * intense," consistently with the rest of the app's color grammar, not an arbitrary new ramp.
 */
export const difficultyMeta: Record<
  MissionDifficulty,
  { label: string; weight: number; color: string }
> = {
  standard: { label: 'Standard', weight: 1, color: tierRing.recruit },
  challenging: { label: 'Challenging', weight: 2, color: palette.electric },
  hard: { label: 'Hard', weight: 3, color: palette.violet },
  epic: { label: 'Epic', weight: 4, color: palette.gold },
};

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

/**
 * `missions.proof_requirements` is untyped `jsonb` (`[{"type": "photo"}, ...]`) — this is the one
 * place that trusts its shape, so a malformed row (or a future proof type this build doesn't know
 * about yet) degrades to an empty chip list instead of crashing the dashboard.
 */
export function parseProofRequirements(
  value: Json,
): { type: ProofType; icon: IconName; label: string }[] {
  if (!Array.isArray(value)) return [];
  const result: { type: ProofType; icon: IconName; label: string }[] = [];
  for (const entry of value) {
    if (
      entry &&
      typeof entry === 'object' &&
      !Array.isArray(entry) &&
      isProofType((entry as { type?: unknown }).type)
    ) {
      const proofType = (entry as { type: ProofType }).type;
      result.push({
        type: proofType,
        icon: proofTypeIcon[proofType],
        label: proofTypeLabel[proofType],
      });
    }
  }
  return result;
}

/**
 * Splits a user's active missions into the one dominant "Main Quest" (per TODO.md §6: "the first
 * screen after login shows one dominant mission, never a list") and everything else. Prefers a
 * `type: 'main'` mission; if the user has none active (mission creation lets them pick 'side' or
 * 'daily' too — nothing requires a main quest to exist), the earliest-deadline mission stands in
 * rather than leaving the dashboard's hero slot empty while missions still exist.
 */
export function pickMainQuest(missions: Mission[]): {
  mainQuest: Mission | null;
  secondary: Mission[];
} {
  if (missions.length === 0) return { mainQuest: null, secondary: [] };

  const byDeadline = (a: Mission, b: Mission) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  };

  const mainQuests = missions.filter((m) => m.type === 'main').sort(byDeadline);
  const mainQuest = mainQuests[0] ?? [...missions].sort(byDeadline)[0] ?? null;
  const secondary = missions.filter((m) => m.id !== mainQuest?.id).sort(byDeadline);

  return { mainQuest, secondary };
}
