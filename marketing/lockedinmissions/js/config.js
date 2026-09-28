// Same public project + publishable key the app and the previous waitlist page already ship.
// The key is meant to be public: RLS allows anonymous INSERT only (waitlist_signups,
// landing_events) and never SELECT, so it can add rows but cannot read anything back.
export const SUPABASE_URL = 'https://usqukqpgwexwjiglhpdj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_prtebrryT7htgxbglRYNgA_nxDZM3-k';

export const restHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};
