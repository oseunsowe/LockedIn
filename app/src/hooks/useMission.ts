import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/missions';

/** A single mission by id — Active Mission Mode is deep-linkable (`/(modals)/active-mission?id=`),
 * so it fetches independently rather than assuming the dashboard/board query already cached it. */
export function useMission(id: string | undefined) {
  return useQuery<Mission>({
    queryKey: ['missions', 'detail', id],
    queryFn: async () => {
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
