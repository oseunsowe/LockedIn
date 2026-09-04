import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** A single `proofs` row — the verification screen needs `mission_id` off it to route a resubmit
 * back to the right mission (§8.3's "generous resubmit path"). */
export function useProof(id: string | undefined) {
  return useQuery({
    queryKey: ['proofs', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proofs')
        .select('*')
        .eq('id', id as string)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}
