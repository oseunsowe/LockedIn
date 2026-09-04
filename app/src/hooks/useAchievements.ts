import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import { iconRegistry, type IconName } from '@/theme';

export type AchievementWithStatus = {
  key: string;
  label: string;
  description: string;
  icon: IconName;
  unlocked: boolean;
  unlockedAt: string | null;
};

function isIconName(value: string): value is IconName {
  return value in iconRegistry;
}

/**
 * The full achievement catalog (`achievements`, public read-only reference data) merged with the
 * user's own unlocks (`user_achievements`). Nothing here can currently be unlocked — the
 * server-evaluated rules engine that awards them (TODO.md §9 P1) isn't built — so every real user
 * will see all-locked. That's shown honestly (a real, empty result), not hidden or faked.
 */
export function useAchievements(userId: string | undefined) {
  return useQuery<AchievementWithStatus[]>({
    queryKey: ['achievements', userId],
    queryFn: async () => {
      const [catalogResult, unlockedResult] = await Promise.all([
        supabase.from('achievements').select('*'),
        supabase
          .from('user_achievements')
          .select('achievement_key, unlocked_at')
          .eq('user_id', userId as string),
      ]);
      if (catalogResult.error) throw catalogResult.error;
      if (unlockedResult.error) throw unlockedResult.error;

      const unlockedMap = new Map(
        unlockedResult.data.map((row) => [row.achievement_key, row.unlocked_at]),
      );

      return catalogResult.data.map((achievement) => ({
        key: achievement.key,
        label: achievement.label,
        description: achievement.description,
        // Falls back to the generic "locked" glyph for any icon string that isn't a real registry
        // key — defensive against the DB column being plain untyped text (see its migration
        // comment), not something expected to actually happen with the current seed data.
        icon: isIconName(achievement.icon) ? achievement.icon : 'locked',
        unlocked: unlockedMap.has(achievement.key),
        unlockedAt: unlockedMap.get(achievement.key) ?? null,
      }));
    },
    enabled: !!userId,
  });
}
