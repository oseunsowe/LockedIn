import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Invokes the `delete-account` Edge Function — App Store Review Guideline 5.1.1(v) requires any
 * app that supports account creation to also support in-app account deletion, not just a support
 * email. Real deletion, not a soft "deactivate" flag: the function removes the user's proof media
 * from Storage and deletes the `auth.users` row, which cascades through every table that
 * references it (see the function's own doc comment for the FK chain).
 *
 * `supabase.functions.invoke` automatically attaches the current session's access token, same as
 * `useVerifyProof` — no manual header wiring needed.
 */
export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
    },
    onSuccess: async () => {
      // The account is already gone server-side; this just clears the now-invalid local session
      // so the root layout's auth gate routes back to onboarding, same as a normal sign-out.
      await supabase.auth.signOut();
    },
  });
}
