import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSubscription } from '@/hooks/useSubscription';
import type { SubscriptionTier } from '@/lib/database.types';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

type TierCard = {
  key: SubscriptionTier;
  label: string;
  verificationsPerDay: number;
  scansPerDay: number;
};

// Keep these in sync by hand with the two Edge Functions that actually enforce them —
// supabase/functions/verify-proof/index.ts's DAILY_VERIFICATION_LIMIT and
// supabase/functions/scan-screenshots/index.ts's DAILY_SCAN_LIMIT. Same "two independent copies
// of one source of truth, kept honest by comment, not by code sharing across the Deno/RN
// boundary" pattern as the XP curve (src/lib/leveling.ts vs. the SQL migration).
const tiers: TierCard[] = [
  { key: 'free', label: 'Free', verificationsPerDay: 5, scansPerDay: 15 },
  { key: 'pro', label: 'Pro', verificationsPerDay: 20, scansPerDay: 60 },
  { key: 'elite', label: 'Elite', verificationsPerDay: 50, scansPerDay: 150 },
];

/**
 * Paywall (TODO.md §12, `LockedIn.md` Screen 15). Framed as the spec calls for — "not a SaaS
 * pricing table; a level-unlock screen" — around the two gates that actually exist and are
 * server-enforced today (AI verification volume, Screenshot Intelligence volume; see both Edge
 * Functions' tier-aware limit maps). Deliberately does NOT list "Focus Mode / advanced missions /
 * XP bonuses" from TODO.md's gate list — none of those exist as real, gateable features yet
 * (Focus Mode has no persistence to gate; the other two aren't built at all), and advertising a
 * tier benefit that doesn't exist would be a customer-facing lie, not a stub.
 *
 * No prices shown, anywhere — real pricing requires App Store Connect products that don't exist
 * yet, and inventing a "$X.99/mo" would be fabricated data. The Subscribe CTA is real UI, visibly
 * disabled ("SOON"), same pattern as Template/AI-generate mission creation and Voice proof — not
 * wired to RevenueCat yet: that needs a paid Apple Developer Program account, a RevenueCat
 * account, and a dev-client build (`react-native-purchases` has no Expo Go support), none of
 * which exist in this environment.
 */
export default function PaywallModal() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const subscriptionQuery = useSubscription(session?.user.id);
  const currentTier = subscriptionQuery.data?.tier ?? 'free';

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

        {subscriptionQuery.isPending ? (
          <ActivityIndicator color={palette.electric} style={styles.loading} />
        ) : (
          <View style={styles.tierList}>
            {tiers.map((tier) => {
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
                  {tier.key !== 'free' ? (
                    <Pressable
                      style={styles.subscribeButton}
                      disabled
                      accessibilityRole="button"
                      accessibilityLabel={`Subscribe to ${tier.label} — launching soon`}
                      accessibilityState={{ disabled: true }}
                    >
                      <Text style={styles.subscribeLabel}>Subscribe</Text>
                      <Text style={styles.soonBadge}>SOON</Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.footnote}>
          Subscriptions aren&rsquo;t live yet — pricing and Apple/Google billing are still being set
          up. Your current plan and daily limits above are real.
        </Text>
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
  footnote: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
    textAlign: 'center',
    marginTop: space.md,
  },
});
