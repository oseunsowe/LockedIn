import { useMutation, useQueryClient } from '@tanstack/react-query';

import { extractedIntentionsQueryKey } from './useExtractedIntentions';
import { compressAndEncode, type EncodedImage } from '@/lib/screenshotIntelligence';
import { supabase } from '@/lib/supabase';
import type { CampaignKey } from '@/theme';

export type PickedScreenshot = { id: string; uri: string; width?: number };

export type ExtractedIntention = {
  id: string;
  intention: string;
  category: CampaignKey;
  confidence: number;
};

/**
 * Invokes the `scan-screenshots` Edge Function (TODO.md §10). Compresses and base64-encodes every
 * picked screenshot client-side, sends them in one request, and never writes them to Storage —
 * see `screenshotIntelligence.ts`'s doc comment for why there's no bucket for this at all.
 */
export function useScanScreenshots(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (screenshots: PickedScreenshot[]): Promise<ExtractedIntention[]> => {
      if (!userId) throw new Error('You must be signed in to scan screenshots.');

      const encoded: EncodedImage[] = await Promise.all(
        screenshots.map((shot) => compressAndEncode(shot.id, shot.uri, shot.width)),
      );

      const { data, error } = await supabase.functions.invoke<{
        intentions?: ExtractedIntention[];
        error?: string;
      }>('scan-screenshots', { body: { images: encoded } });
      if (error) throw error;
      if (!data) throw new Error('No scan result returned.');
      if (data.error) throw new Error(data.error);
      return data.intentions ?? [];
    },
    onSuccess: () => {
      if (userId)
        void queryClient.invalidateQueries({ queryKey: extractedIntentionsQueryKey(userId) });
    },
  });
}
