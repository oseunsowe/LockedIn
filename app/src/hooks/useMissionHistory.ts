import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/missions';

/** Missions that have reached an outcome (`completed`/`failed`/`recovery`) — the Progress
 * Profile's mission history. Active missions live on the Dashboard/Mission Board instead; this is
 * specifically the "how have I done" record, not "what's in flight." */
export function useMissionHistory(userId: string | undefined) {
  return useQuery<Mission[]>({
    queryKey: ['missions', userId, 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId as string)
        .neq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
