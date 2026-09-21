import type { SubscriptionTier } from '@/lib/database.types';

export type BillingPeriod = 'monthly' | 'yearly';

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
export const plans: Plan[] = [
  { key: 'free', label: 'Free', verificationsPerDay: 5, scansPerDay: 15, priceUsd: null },
  {
    key: 'pro',
    label: 'Pro',
    verificationsPerDay: 20,
    scansPerDay: 60,
    priceUsd: { monthly: 4.99, yearly: 39.99 },
  },
  {
    key: 'elite',
    label: 'Elite',
    verificationsPerDay: 50,
    scansPerDay: 150,
    priceUsd: { monthly: 9.99, yearly: 79.99 },
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
export function yearlySavingsPercent(price: Record<BillingPeriod, number>): number {
  return Math.round((1 - price.yearly / (price.monthly * 12)) * 100);
}
