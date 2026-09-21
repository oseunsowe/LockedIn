import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/hooks/useSubscription';
import { LEGAL_URL } from '@/lib/legal';
import {
  PRICES_ARE_PLACEHOLDER,
  TRIAL_DAYS,
  formatUsd,
  plans,
  yearlySavingsPercent,
  type BillingPeriod,
  type Plan,
} from '@/lib/plans';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

// The paid plans share one saving figure in practice, but compute the headline from the cheapest
// gap so the toggle's badge never overstates what any single plan actually saves.
const paidPlans = plans.filter(
  (plan): plan is Plan & { priceUsd: NonNullable<Plan['priceUsd']> } => plan.priceUsd !== null,
);
const yearlySavings = Math.min(...paidPlans.map((plan) => yearlySavingsPercent(plan.priceUsd)));

/**
 * Paywall (TODO.md §12, `LockedIn.md` Screen 15). Framed as the spec calls for — "not a SaaS
 * pricing table; a level-unlock screen" — around the two gates that actually exist and are
 * server-enforced today (AI verification volume, Screenshot Intelligence volume). Plans, limits,
 * prices, and the trial length all come from src/lib/plans.ts. Deliberately does NOT list "Focus
 * Mode / advanced missions / XP bonuses" — none of those exist as real, gateable features yet.
 *
 * The prices are placeholders (PRICES_ARE_PLACEHOLDER) and say so on screen. The Subscribe button
 * is real UI but disabled: taking payment needs `react-native-purchases` (no Expo Go support, so a
 * dev-client build) plus App Store / Play products. The server half is live — the
 * revenuecat-webhook Edge Function writes `subscriptions.tier` when a purchase happens.
 */
export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const subscriptionQuery = useSubscription(session?.user.id);
  const currentTier = subscriptionQuery.data?.tier ?? 'free';
  const [period, setPeriod] = useState<BillingPeriod>('yearly');

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.closeButton, { top: insets.top + space.sm }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Icon name="close" size={18} color={semantic.text.secondary} />
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <View style={styles.iconWrap}>
          <Icon name="gem" size={32} color={palette.gold} />
        </View>
        <Text style={styles.title}>Unlock Your Next Level</Text>
        <Text style={styles.subtitle}>
          More AI verifications and screenshot scans per day, for when one mission a day isn&rsquo;t
          enough.
        </Text>

        <View style={styles.periodToggle} accessibilityRole="radiogroup">
          {(['monthly', 'yearly'] as const).map((option) => {
            const selected = option === period;
            return (
              <Pressable
                key={option}
                style={[styles.periodOption, selected ? styles.periodOptionSelected : null]}
                onPress={() => setPeriod(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={
                  option === 'yearly' ? `Yearly, save ${yearlySavings} percent` : 'Monthly'
                }
              >
                <Text style={[styles.periodLabel, selected ? styles.periodLabelSelected : null]}>
                  {option === 'yearly' ? 'Yearly' : 'Monthly'}
                </Text>
                {option === 'yearly' ? (
                  <Text style={styles.saveBadge}>SAVE {yearlySavings}%</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {subscriptionQuery.isPending ? (
          <ActivityIndicator color={palette.electric} style={styles.loading} />
        ) : (
          <View style={styles.tierList}>
            {plans.map((tier) => {
              const isCurrent = tier.key === currentTier;
              return (
                <View
                  key={tier.key}
                  style={[styles.tierCard, isCurrent ? styles.tierCardCurrent : null]}
                >
                  <View style={styles.tierHeader}>
                    <Text style={styles.tierLabel}>{tier.label}</Text>
                    {isCurrent ? (
                      <View style={styles.currentChip}>
                        <Text style={styles.currentChipLabel}>YOUR PLAN</Text>
                      </View>
                    ) : null}
                  </View>
                  {tier.priceUsd ? (
                    <View style={styles.priceBlock}>
                      <Text style={styles.priceText}>
                        {formatUsd(tier.priceUsd[period])}
                        <Text style={styles.pricePeriod}>
                          {period === 'yearly' ? ' / year' : ' / month'}
                        </Text>
                      </Text>
                      {period === 'yearly' ? (
                        <Text style={styles.priceSub}>
                          about {formatUsd(tier.priceUsd.yearly / 12)} / month
                        </Text>
                      ) : null}
                    </View>
                  ) : (
                    <Text style={styles.priceText}>Free</Text>
                  )}
                  <View style={styles.tierRow}>
                    <Icon name="verified" size={14} color={semantic.text.tertiary} />
                    <Text style={styles.tierRowText}>
                      {tier.verificationsPerDay} AI verifications / day
                    </Text>
                  </View>
                  <View style={styles.tierRow}>
                    <Icon name="ai" size={14} color={semantic.text.tertiary} />
                    <Text style={styles.tierRowText}>
                      {tier.scansPerDay} screenshot scans / day
                    </Text>
                  </View>
                  {tier.key !== 'free' && !isCurrent ? (
                    <Pressable
                      style={styles.subscribeButton}
                      disabled
                      accessibilityRole="button"
                      accessibilityLabel={`Start ${TRIAL_DAYS}-day free trial of ${tier.label} — launching soon`}
                      accessibilityState={{ disabled: true }}
                    >
                      <Text style={styles.subscribeLabel}>Start {TRIAL_DAYS}-day free trial</Text>
                      <Text style={styles.soonBadge}>SOON</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.footnote}>
          {PRICES_ARE_PLACEHOLDER
            ? 'Prices shown are placeholders — subscriptions aren’t live yet. '
            : ''}
          Your current plan and daily limits above are real. Paid plans renew automatically after
          the {TRIAL_DAYS}-day trial unless cancelled at least 24 hours before it ends, and can be
          cancelled anytime in your App Store or Google Play subscription settings.
        </Text>
        <View style={styles.legalRow}>
          <Pressable
            onPress={() => void Linking.openURL(`${LEGAL_URL}#privacy`)}
            accessibilityRole="link"
            accessibilityLabel="Open Privacy Policy"
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
          <Text style={styles.footnote}>·</Text>
          <Pressable
            onPress={() => void Linking.openURL(`${LEGAL_URL}#terms`)}
            accessibilityRole="link"
            accessibilityLabel="Open Terms of Service"
          >
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  closeButton: {
    position: 'absolute',
    right: space.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: space.xl,
    alignItems: 'center',
    gap: space.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: withAlpha(palette.gold, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.md,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...type.body,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  loading: {
    marginTop: space.xxl,
  },
  tierList: {
    width: '100%',
    gap: space.md,
    marginTop: space.md,
  },
  tierCard: {
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  tierCardCurrent: {
    borderColor: palette.electric,
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tierLabel: {
    ...type.title,
    fontSize: 18,
    color: semantic.text.primary,
  },
  currentChip: {
    paddingVertical: 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.electric, 0.16),
  },
  currentChipLabel: {
    ...type.data,
    fontSize: 10,
    color: palette.electric,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  tierRowText: {
    ...type.caption,
    color: semantic.text.secondary,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    marginTop: space.sm,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    backgroundColor: semantic.glass.fill8,
    opacity: 0.6,
  },
  subscribeLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.secondary,
  },
  soonBadge: {
    ...type.data,
    fontSize: 9,
    color: palette.iris,
  },
  periodToggle: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: space.xs,
    borderRadius: radius.pill,
    backgroundColor: semantic.bg.surface,
  },
  periodOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  periodOptionSelected: {
    backgroundColor: withAlpha(palette.electric, 0.18),
  },
  periodLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.secondary,
  },
  periodLabelSelected: {
    color: semantic.text.primary,
  },
  saveBadge: {
    ...type.data,
    fontSize: 9,
    color: palette.gold,
  },
  priceBlock: {
    gap: 2,
  },
  priceText: {
    ...type.title,
    fontSize: 22,
    color: semantic.text.primary,
  },
  pricePeriod: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  priceSub: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  legalLink: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.secondary,
    textDecorationLine: 'underline',
  },
  footnote: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
    textAlign: 'center',
    marginTop: space.md,
  },
});
