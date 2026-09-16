import { useMutation, useQueryClient } from '@tanstack/react-query';

import { activeMissionsQueryKey } from './useActiveMissions';
import { recoveryMissionsQueryKey } from './useRecoveryMissions';
import { supabase } from '@/lib/supabase';

export type VerificationVerdict = {
  verified: boolean;
  confidence: number;
  reasoning: string;
  suggestedXp: number;
};

/**
 * Invokes the `verify-proof` Edge Function (`supabase/functions/verify-proof`) — the server-side
 * proxy that holds the Anthropic API key (TODO.md §8.1: never in the client bundle). This call is
 * real, and now confirmed working end to end against a live project.
 *
 * A verified verdict changes several rows server-side in one shot (mission status, `xp_events`,
 * `profiles.xp_total`/`level`/`streak_count`, `user_achievements`) that React Query has no way to
 * know about on its own — it only tracks the queries *this* client made, not a Deno function's
 * writes. Without invalidating them here, the Progress Profile, Insights, and Mission Board could
 * all keep rendering pre-verification data (stale completion rate, missing achievement, a mission
 * still listed as active) until something else happened to refetch — this is what surfaced the
 * mission-status race `useMissionStatus.ts` now guards against.
 */
export function useVerifyProof(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (proofId: string): Promise<VerificationVerdict> => {
      const { data, error } = await supabase.functions.invoke<VerificationVerdict>('verify-proof', {
        body: { proofId },
      });
      if (error) throw error;
      if (!data) throw new Error('No verification result returned.');
      return data;
    },
    onSuccess: (verdict) => {
      if (!verdict.verified || !userId) return;
      void queryClient.invalidateQueries({ queryKey: activeMissionsQueryKey(userId) });
      void queryClient.invalidateQueries({ queryKey: recoveryMissionsQueryKey(userId) });
      void queryClient.invalidateQueries({ queryKey: ['missions', userId, 'history'] });
      void queryClient.invalidateQueries({ queryKey: ['missions', 'detail'] });
      void queryClient.invalidateQueries({ queryKey: ['progress-stats', userId] });
      void queryClient.invalidateQueries({ queryKey: ['achievements', userId] });
    },
  });
}
