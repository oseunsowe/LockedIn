import { useMutation, useQueryClient } from '@tanstack/react-query';

import { activeMissionsQueryKey } from './useActiveMissions';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type MissionInsert = Database['public']['Tables']['missions']['Insert'];
export type NewMissionInput = Omit<MissionInsert, 'user_id'>;

/** Manual mission creation (TODO.md §7.2). Invalidates the dashboard/board's shared query key on
 * success so both screens reflect the new mission without a manual refetch. */
export function useCreateMission(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: NewMissionInput) => {
      if (!userId) throw new Error('You must be signed in to create a mission.');
      const { data, error } = await supabase
        .from('missions')
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: activeMissionsQueryKey(userId) });
      }
    },
  });
}
