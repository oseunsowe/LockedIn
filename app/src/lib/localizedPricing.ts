import { formatUsd } from './plans';

export type LocalizedPrice = {
  amount: number;
  currencyCode: string;
  /** Ready-to-render string, e.g. "$9.99" or, once real, "£8.49" / "₹399". */
  formatted: string;
  /** True until a real RevenueCat Package supplies a store-resolved price. Lets the UI show a
   * subtle "approx." treatment for the flat-USD placeholder without a separate boolean to thread
   * through every call site. */
  isEstimate: boolean;
};

/**
 * Placeholder for the localized price RevenueCat will supply once real App Store / Play products
 * exist (TODO.md §12.3) and territory pricing is configured per §12.2's PPP tier plan. Every
 * caller in the app should go through this function rather than reading `plan.priceUsd` directly,
 * so swapping the implementation is a one-file change, not a find-and-replace across every screen
 * that shows a price.
 *
 * Real implementation, once `react-native-purchases` is added and `Purchases.getOfferings()` is
 * wired up, becomes something like:
 *
 *   const pkg = offering.availablePackages.find((p) => p.identifier === productId(tier, period));
 *   return {
 *     amount: pkg.product.price,
 *     currencyCode: pkg.product.currencyCode,
 *     formatted: pkg.product.priceString,
 *     isEstimate: false,
 *   };
 *
 * StoreKit/Play Billing resolve the user's actual storefront price server-side from whatever
 * territory pricing was configured when the products were created — the app never computes PPP
 * math itself. Until that exists, every user sees the same flat USD reference price from
 * `plans.ts`, clearly marked as an estimate.
 */
export function getLocalizedPrice(amountUsd: number): LocalizedPrice {
  return {
    amount: amountUsd,
    currencyCode: 'USD',
    formatted: formatUsd(amountUsd),
    isEstimate: true,
  };
}
