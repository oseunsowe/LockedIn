import { useQuery } from '@tanstack/react-query';

import { computeCompletionRate, computeConsistency, computeGrowthTrend } from '@/lib/progressStats';
import { supabase } from '@/lib/supabase';

const CONSISTENCY_WINDOW_DAYS = 30;

export function useProgressStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['progress-stats', userId],
    queryFn: async () => {
      const windowStart = new Date(
        Date.now() - CONSISTENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      ).toISOString();

      const [xpEventsResult, missionsResult] = await Promise.all([
        supabase
          .from('xp_events')
          .select('amount, created_at')
          .eq('user_id', userId as string)
          .gte('created_at', windowStart),
        supabase
          .from('missions')
          .select('status')
          .eq('user_id', userId as string),
      ]);

      if (xpEventsResult.error) throw xpEventsResult.error;
      if (missionsResult.error) throw missionsResult.error;

      const xpEvents = xpEventsResult.data;
      const missions = missionsResult.data;

      return {
        consistencyPct: computeConsistency(
          xpEvents.map((event) => event.created_at),
          CONSISTENCY_WINDOW_DAYS,
        ),
        completionRatePct: computeCompletionRate(missions.map((mission) => mission.status)),
        growthTrend: computeGrowthTrend(xpEvents),
      };
    },
    enabled: !!userId,
  });
}
