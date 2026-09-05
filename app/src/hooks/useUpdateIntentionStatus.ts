import { useMutation, useQueryClient } from '@tanstack/react-query';

import { extractedIntentionsQueryKey } from './useExtractedIntentions';
import { supabase } from '@/lib/supabase';

/** Moves one extracted intention to `converted` (after "Turn into Mission" succeeds) or `ignored`
 * (dismissed) — a status flag on the user's own draft row, real client update under
 * `extracted_intentions_update_own`. */
export function useUpdateIntentionStatus(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; status: 'converted' | 'ignored' }) => {
      const { error } = await supabase
        .from('extracted_intentions')
        .update({ status: input.status })
        .eq('id', input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId)
        void queryClient.invalidateQueries({ queryKey: extractedIntentionsQueryKey(userId) });
    },
  });
}
