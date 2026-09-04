import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/** Updates `profiles.display_name` (real client update, RLS `profiles_update_own`). Does not
 * touch the auth context's cached `profile` itself — callers should follow a successful mutation
 * with `useAuth().refreshProfile()` so the greeting/header everywhere else picks up the change. */
export function useUpdateDisplayName(userId: string | undefined) {
  return useMutation({
    mutationFn: async (displayName: string) => {
      if (!userId) throw new Error('You must be signed in to update your name.');
      const trimmed = displayName.trim();
      if (!trimmed) throw new Error('Name cannot be empty.');

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmed })
        .eq('id', userId);
      if (error) throw error;
      return trimmed;
    },
  });
}
