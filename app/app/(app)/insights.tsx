import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useActiveMissions } from '@/hooks/useActiveMissions';
import { useProgressStats } from '@/hooks/useProgressStats';
import { generateInsights, type InsightTone } from '@/lib/insights';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

function NumberTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.numberTile}>
      <Text style={styles.numberValue}>{value}</Text>
      <Text style={styles.numberLabel}>{label}</Text>
    </View>
  );
}

const toneColor: Record<InsightTone, string> = {
  positive: semantic.state.success,
  warning: semantic.state.warning,
  neutral: palette.violet,
};

/**
 * AI Insights (TODO.md §6 P1, the MVP stand-in for the cut voice-first AI Coach — see
 * `docs/DESIGN-SYSTEM.md`'s "AI Companion" component). See `src/lib/insights.ts`'s doc comment for
 * the important caveat: this is a deterministic rule engine over real data, not a live Claude
 * call. Labeled honestly in-screen too, not just in code comments.
 */
export default function InsightsScreen() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const missionsQuery = useActiveMissions(session?.user.id);
  const statsQuery = useProgressStats(session?.user.id);

  if (!profile) return null;

  const isLoading = missionsQuery.isPending || statsQuery.isPending;
  const isError = missionsQuery.isError || statsQuery.isError;
  const isRefreshing = missionsQuery.isRefetching || statsQuery.isRefetching;

  const insights =
    statsQuery.data && missionsQuery.data
      ? generateInsights({
          streakCount: profile.streak_count,
          consistencyPct: statsQuery.data.consistencyPct,
          completionRatePct: statsQuery.data.completionRatePct,
          growthTrend: statsQuery.data.growthTrend,
          activeMissions: missionsQuery.data,
        })
      : [];

  function refetchAll() {
    void missionsQuery.refetch();
    void statsQuery.refetch();
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxxl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refetchAll}
          tintColor={palette.electric}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <Text style={styles.subtitle}>
          Patterns from your own activity — not a live AI call, just the numbers, read plainly.
        </Text>
      </View>

      {statsQuery.data ? (
        <View style={styles.numbersRow}>
          <NumberTile label="Streak" value={`${profile.streak_count}d`} />
          <NumberTile label="Consistency" value={`${statsQuery.data.consistencyPct}%`} />
          <NumberTile
            label="Completion"
            value={
              statsQuery.data.completionRatePct !== null
                ? `${statsQuery.data.completionRatePct}%`
                : '—'
            }
          />
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={palette.electric} style={styles.loading} />
      ) : isError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Couldn&rsquo;t load your insights.</Text>
          <Pressable style={styles.retryButton} onPress={refetchAll}>
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : insights.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="ai" size={32} color={semantic.text.tertiary} />
          <Text style={styles.emptyTitle}>Nothing to flag right now.</Text>
          <Text style={styles.emptySubtitle}>
            Complete a few missions and patterns will start showing up here.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {insights.map((insight) => (
            <View key={insight.id} style={styles.card}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: withAlpha(toneColor[insight.tone], 0.14) },
                ]}
              >
                <Icon name={insight.icon} size={20} color={toneColor[insight.tone]} />
              </View>
              <Text style={styles.cardMessage}>{insight.message}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  content: {
    paddingHorizontal: space.xl,
    gap: space.xl,
  },
  header: {
    gap: space.xs,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
  },
  subtitle: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  numbersRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  numberTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  numberValue: {
    ...type.title,
    color: semantic.text.primary,
  },
  numberLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  loading: {
    marginTop: space.xxl,
  },
  errorCard: {
    alignItems: 'center',
    gap: space.md,
    padding: space.xl,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
  },
  errorText: {
    ...type.body,
    color: semantic.text.secondary,
  },
  retryButton: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  retryLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  emptyState: {
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  emptyTitle: {
    ...type.bodyMedium,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...type.caption,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  list: {
    gap: space.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.icon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMessage: {
    ...type.body,
    flex: 1,
    color: semantic.text.primary,
  },
});
