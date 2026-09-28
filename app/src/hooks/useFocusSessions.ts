import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { demoFocusStats } from '@/lib/demoData';
import { useDemoMode } from '@/lib/demoMode';
import { computeFocusStats, type FocusStats } from '@/lib/focusStats';
import { supabase } from '@/lib/supabase';

const focusStatsKey = (userId: string | undefined) => ['focus-stats', userId] as const;

/** Focus time this week and today, from the user's saved Focus Mode sessions. */
export function useFocusStats(userId: string | undefined) {
  const demo = useDemoMode();
  return useQuery<FocusStats>({
    queryKey: demo.enabled ? ['demo', 'focus-stats', demo.seed] : focusStatsKey(userId),
    queryFn: async () => {
      if (demo.enabled) return demoFocusStats(demo.seed);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('started_at, duration_seconds')
        .eq('user_id', userId as string)
        .gte('started_at', weekAgo);
      if (error) throw error;
      return computeFocusStats(data);
    },
    enabled: !!userId,
  });
}

export type FocusSessionInput = {
  missionId: string | null;
  startedAt: Date;
  durationSeconds: number;
};

/** Saves one finished Focus Mode session. Sessions under 30 seconds are treated as accidental taps. */
export function useLogFocusSession(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FocusSessionInput) => {
      if (!userId || input.durationSeconds < 30) return;
      // Demo missions have synthetic ids that aren't real rows.
      const missionId = input.missionId?.startsWith('demo-') ? null : input.missionId;
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: userId,
        mission_id: missionId,
        started_at: input.startedAt.toISOString(),
        duration_seconds: Math.min(Math.round(input.durationSeconds), 43200),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: focusStatsKey(userId) });
    },
  });
}
