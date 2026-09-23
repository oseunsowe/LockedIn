import type { SubscriptionTier } from '@/lib/database.types';

export type BillingPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

/** Periods that make sense to offer a free trial on. A trial longer than the period it's gating
 * (e.g. a 7-day trial on a $4.99 week pass) would just be a free week, not a trial — so `daily`
 * and `weekly` never show trial copy, only `monthly`/`yearly` do (see `TRIAL_ELIGIBLE_PERIODS`). */
export const TRIAL_ELIGIBLE_PERIODS: readonly BillingPeriod[] = ['monthly', 'yearly'];

export type Plan = {
  key: SubscriptionTier;
  label: string;
  verificationsPerDay: number;
  scansPerDay: number;
  /** USD price per billing period; `null` for the free plan. */
  priceUsd: Record<BillingPeriod, number> | null;
};

export const TRIAL_DAYS = 7;

/** Flip to `false` once real App Store / Play products exist and these prices match them. The
 * paywall shows a "placeholder prices" notice while this is `true`. */
export const PRICES_ARE_PLACEHOLDER = true;

// Daily limits are enforced server-side, so these must equal DAILY_VERIFICATION_LIMIT in
// supabase/functions/verify-proof/index.ts and DAILY_SCAN_LIMIT in
// supabase/functions/scan-screenshots/index.ts — src/lib/__tests__/plans.test.ts fails if they drift.
//
// Prices are competitor-researched (2026-09-22, TODO.md §12.2), not arbitrary: Tonic: Earn Screen
// Time ($9.99/mo, $29.99/yr — the closest direct comparable, also AI-verification-based), Opal
// ($19.99/mo, $99.99/yr — the category's most-complained-about price for a feature that overlaps
// free iOS Screen Time), One Sec (~$2.99/mo, $19.99/yr), ScrollToll (~$2.29/mo). Pro's monthly
// anchors just under Tonic to win the head-to-head comparison; Elite's monthly anchors just under
// Opal for the same reason. None of the four offer anything shorter than monthly — the `daily`/
// `weekly` periods fill that gap deliberately, for a mission/sprint-shaped product where a user
// cramming for one exam or one launch week has no reason to commit to 30 days.
//
// Platform note for whoever creates the real products: Apple's shortest auto-renewable
// subscription duration is 1 week — there is no such thing as a daily auto-renewing subscription
// on iOS. `daily` must be a Non-Consumable/Consumable IAP with RevenueCat's non-subscription
// "duration" grant (24h), not a StoreKit subscription. `weekly`/`monthly`/`yearly` are real
// auto-renewable subscriptions on both platforms. Google Play Billing has no such restriction —
// `daily` can be a real subscription base plan (P1D) on Android if we don't want to special-case it.
export const plans: Plan[] = [
  { key: 'free', label: 'Free', verificationsPerDay: 5, scansPerDay: 15, priceUsd: null },
  {
    key: 'pro',
    label: 'Pro',
    verificationsPerDay: 20,
    scansPerDay: 60,
    priceUsd: { daily: 1.99, weekly: 4.99, monthly: 9.99, yearly: 59.99 },
  },
  {
    key: 'elite',
    label: 'Elite',
    verificationsPerDay: 50,
    scansPerDay: 150,
    priceUsd: { daily: 3.99, weekly: 9.99, monthly: 19.99, yearly: 129.99 },
  },
];

/** Store product id, e.g. `lockedin_pro_monthly`. The revenuecat-webhook Edge Function reads the
 * tier back out of this name, so create the App Store / Play products with exactly these ids. */
export function productId(tier: Exclude<SubscriptionTier, 'free'>, period: BillingPeriod): string {
  return `lockedin_${tier}_${period}`;
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Whole-number percent saved by paying yearly instead of twelve monthly payments. */
export function yearlySavingsPercent(
  price: Pick<Record<BillingPeriod, number>, 'monthly' | 'yearly'>,
): number {
  return Math.round((1 - price.yearly / (price.monthly * 12)) * 100);
}
