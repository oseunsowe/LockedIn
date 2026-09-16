import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { CampaignKey } from '@/theme';

/**
 * The campaigns a user actually picked in onboarding (`user_campaigns`) — mission creation offers
 * these as the "goal" chips, not the full 8-campaign catalog, so a mission always maps back to
 * something the user told the app they care about.
 */
export function useUserCampaigns(userId: string | undefined) {
  return useQuery<CampaignKey[]>({
    queryKey: userId ? ['user_campaigns', userId] : ['user_campaigns', 'anonymous'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_campaigns')
        .select('campaign_key')
        .eq('user_id', userId as string);
      if (error) throw error;
      return data.map((row) => row.campaign_key);
    },
    enabled: !!userId,
  });
}
