import { useQuery } from '@tanstack/react-query';

import { demoActiveMissions } from '@/lib/demoData';
import { useDemoMode } from '@/lib/demoMode';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/missions';

export function activeMissionsQueryKey(userId: string) {
  return ['missions', userId, 'active'] as const;
}

/**
 * A user's in-progress missions (`status = 'active'`) — everything else (completed/failed/
 * recovery) belongs to Phase 11's history view, not the dashboard. `enabled: !!userId` keeps this
 * idle (no request, no loading flicker) until auth has actually resolved a signed-in user.
 */
export function useActiveMissions(userId: string | undefined) {
  const demo = useDemoMode();
  return useQuery<Mission[]>({
    queryKey: demo.enabled
      ? ['demo', 'missions', 'active', demo.seed]
      : userId
        ? activeMissionsQueryKey(userId)
        : ['missions', 'anonymous'],
    queryFn: async () => {
      if (demo.enabled) return demoActiveMissions(demo.seed, userId);
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId as string)
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
