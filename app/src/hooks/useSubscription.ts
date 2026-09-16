import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { SubscriptionStatus, SubscriptionTier } from '@/lib/database.types';

export type Subscription = {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  current_period_end: string | null;
};

/** Every profile gets a `subscriptions` row automatically (`on_profile_created_subscription`
 * trigger), defaulting to `tier: 'free'` — this just reads it under `subscriptions_select_own`.
 * Written only by a future RevenueCat webhook handler; nothing in the client ever writes here. */
export function useSubscription(userId: string | undefined) {
  return useQuery<Subscription>({
    queryKey: ['subscription', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('tier, status, current_period_end')
        .eq('user_id', userId as string)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
