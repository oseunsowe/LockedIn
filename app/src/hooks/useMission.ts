import { useQuery } from '@tanstack/react-query';

import { demoActiveMissions, demoMissionHistory, demoRecoveryMissions } from '@/lib/demoData';
import { useDemoMode } from '@/lib/demoMode';
import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/missions';

/** A single mission by id — Active Mission Mode is deep-linkable (`/(modals)/active-mission?id=`),
 * so it fetches independently rather than assuming the dashboard/board query already cached it. */
export function useMission(id: string | undefined) {
  const demo = useDemoMode();
  return useQuery<Mission>({
    queryKey: ['missions', 'detail', id, demo.enabled ? demo.seed : null],
    queryFn: async () => {
      if (id?.startsWith('demo-')) {
        const all = [
          ...demoActiveMissions(demo.seed),
          ...demoRecoveryMissions(demo.seed),
          ...demoMissionHistory(demo.seed),
        ];
        const found = all.find((mission) => mission.id === id);
        if (!found) throw new Error('Demo mission not found');
        return found;
      }
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
