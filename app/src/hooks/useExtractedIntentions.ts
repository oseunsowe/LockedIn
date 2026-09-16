import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { CampaignKey } from '@/theme';

export type ExtractedIntentionRow = {
  id: string;
  intention: string;
  category: CampaignKey;
  confidence: number;
  status: 'pending' | 'converted' | 'ignored';
  created_at: string;
};

export function extractedIntentionsQueryKey(userId: string) {
  return ['extracted-intentions', userId] as const;
}

/** Pending Screenshot Intelligence results (TODO.md §10's "Review" state) — extraction rows a
 * user hasn't yet turned into a mission or dismissed. Written only by `scan-screenshots`
 * (service_role); this just reads the user's own rows under `extracted_intentions_select_own`. */
export function usePendingIntentions(userId: string | undefined) {
  return useQuery<ExtractedIntentionRow[]>({
    queryKey: userId ? extractedIntentionsQueryKey(userId) : ['extracted-intentions', 'anonymous'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('extracted_intentions')
        .select('id, intention, category, confidence, status, created_at')
        .eq('user_id', userId as string)
        .eq('status', 'pending')
        .order('confidence', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
