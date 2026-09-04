import { useMutation, useQueryClient } from '@tanstack/react-query';

import { activeMissionsQueryKey } from './useActiveMissions';
import { uploadProofAsset, type PickedAsset } from '@/lib/proofUpload';
import { supabase } from '@/lib/supabase';
import type { ProofType } from '@/lib/database.types';

/** Uploads the picked asset, then inserts the `proofs` row (RLS: `proofs_insert_own`, real client
 * insert — only `verifications`/`xp_events` need the service-role Edge Function, per §8.1). */
export function useSubmitProof(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { missionId: string; proofType: ProofType; asset: PickedAsset }) => {
      if (!userId) throw new Error('You must be signed in to submit proof.');

      const { path } = await uploadProofAsset({
        userId,
        proofType: input.proofType,
        asset: input.asset,
      });

      const { data, error } = await supabase
        .from('proofs')
        .insert({
          mission_id: input.missionId,
          user_id: userId,
          type: input.proofType,
          storage_path: path,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: activeMissionsQueryKey(userId) });
    },
  });
}
