// Shared across every Edge Function that gates a paid-AI-cost feature by subscription tier
// (TODO.md §12: "Server-side entitlement checks. Never trust a client boolean for a paid AI
// call."). `subscriptions` rows are created automatically for every profile (see
// 20260901000006_subscriptions.sql's `on_profile_created_subscription` trigger) and are written
// only by the revenuecat-webhook Edge Function (service_role) — never by the client, so reading
// `tier` here is trustworthy the same way reading `auth.uid()` from a validated JWT is.
//
// The webhook is live and tested, but nothing calls it yet: the app has no purchase flow until the
// RevenueCat SDK, a dev-client build, and App Store / Play products exist. Until then a user's
// tier only changes by hand in the database; either way the higher limit applies immediately,
// with no app update or client trust involved.

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
