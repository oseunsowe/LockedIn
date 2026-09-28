import { useQuery } from '@tanstack/react-query';

import { demoRecoveryMissions } from '@/lib/demoData';
import { useDemoMode } from '@/lib/demoMode';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/missions';

export function recoveryMissionsQueryKey(userId: string) {
  return ['missions', userId, 'recovery'] as const;
}

/** Missions in `status = 'recovery'` (TODO.md §9: "Failed mission = 'Recovery Mode Activated.'
 * No red, no shame, no broken-streak funeral.") — a distinct, non-alarming section on the mission
 * board, never mixed into the active list and never labeled "failed" in the UI. */
export function useRecoveryMissions(userId: string | undefined) {
  const demo = useDemoMode();
  return useQuery<Mission[]>({
    queryKey: demo.enabled
      ? ['demo', 'missions', 'recovery', demo.seed]
      : userId
        ? recoveryMissionsQueryKey(userId)
        : ['missions', 'anonymous', 'recovery'],
    queryFn: async () => {
      if (demo.enabled) return demoRecoveryMissions(demo.seed, userId);
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId as string)
        .eq('status', 'recovery');
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
