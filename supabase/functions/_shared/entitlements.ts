// Shared across every Edge Function that gates a paid-AI-cost feature by subscription tier
// (TODO.md §12: "Server-side entitlement checks. Never trust a client boolean for a paid AI
// call."). `subscriptions` rows are created automatically for every profile (see
// 20260901000006_subscriptions.sql's `on_profile_created_subscription` trigger) and are written
// only by a future RevenueCat webhook handler (service_role) — never by the client, so reading
// `tier` here is trustworthy the same way reading `auth.uid()` from a validated JWT is.
//
// Not wired to a real payment processor yet (Phase 12 is otherwise unbuilt — no RevenueCat
// account/App Store Connect products exist in this environment to test against). What's real
// today: every user has a genuine `tier` value (defaulting to `free`), and these limits are
// actually enforced against it — a user manually flipped to `pro`/`elite` in the database (e.g.
// by a future webhook, or by hand for testing) immediately gets the higher limit, with no app
// update or client trust involved.

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export type SubscriptionTier = 'free' | 'pro' | 'elite';

/** Defaults to `free` on any lookup failure — an entitlement check that fails open into the paid
 * tier would be the actual security bug TODO.md §12 is warning about. */
export async function getSubscriptionTier(
  // deno-lint-ignore no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  userId: string,
): Promise<SubscriptionTier> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', userId)
    .single();

  if (error || !data) return 'free';
  // An expired/canceled subscription doesn't keep its paid limits — only `active`/`trialing`
  // count as currently entitled.
  if (data.status !== 'active' && data.status !== 'trialing') return 'free';
  return data.tier as SubscriptionTier;
}
