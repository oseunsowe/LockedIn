import { router } from 'expo-router';
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

import { ProfileButton } from '@/components/ProfileButton';
import { DailyCommandCard } from '@/components/DailyCommandCard';
import { MainQuestCard } from '@/components/MainQuestCard';
import { MissionRow } from '@/components/MissionRow';
import { NamePrompt } from '@/components/NamePrompt';
import { XpBar } from '@/components/XpBar';
import { useActiveMissions } from '@/hooks/useActiveMissions';
import { useFocusStats } from '@/hooks/useFocusSessions';
import { useMissionHistory } from '@/hooks/useMissionHistory';
import { useProgressStats } from '@/hooks/useProgressStats';
import { computeDailyProgress } from '@/lib/dailyProgress';
import { generateInsights } from '@/lib/insights';
import { pickMainQuest } from '@/lib/missions';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const missionsQuery = useActiveMissions(session?.user.id);
  const historyQuery = useMissionHistory(session?.user.id);
  const focusQuery = useFocusStats(session?.user.id);
  const statsQuery = useProgressStats(session?.user.id);

  // AppGate (app/_layout.tsx) never renders this route until `profile` resolves — this guard is
  // just cheap insurance against a Fast Refresh edge case, not a real steady-state path.
  if (!profile) return null;

  const displayName = profile.display_name ?? 'there';
  const { mainQuest, secondary } = pickMainQuest(missionsQuery.data ?? []);
  const daily = computeDailyProgress({
    active: missionsQuery.data ?? [],
    history: historyQuery.data ?? [],
  });
  // Rule-based insight over real data (labelled as such) — shown only when there is one to show.
  const topInsight =
    statsQuery.data && missionsQuery.data
      ? generateInsights({
          streakCount: profile.streak_count,
          consistencyPct: statsQuery.data.consistencyPct,
          completionRatePct: statsQuery.data.completionRatePct,
          growthTrend: statsQuery.data.growthTrend,
          activeMissions: missionsQuery.data,
        })[0]
      : undefined;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxxl },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={missionsQuery.isRefetching}
          onRefresh={() => void missionsQuery.refetch()}
          tintColor={palette.electric}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.wordmark}>
            Locked<Text style={styles.wordmarkAccent}>In</Text>
          </Text>
          <Text style={styles.greeting}>
            {greeting()}, {displayName}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.level}>
              LEVEL {profile.level}
              {profile.identity_class ? ` · ${profile.identity_class.toUpperCase()}` : ''}
            </Text>
            {profile.streak_count > 0 ? (
              <View style={styles.streakChip}>
                <Icon name="streak" size={13} color={palette.gold} />
                <Text style={styles.streakText}>{profile.streak_count}</Text>
              </View>
            ) : null}
          </View>
          <XpBar totalXp={profile.xp_total} />
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push('/(modals)/screenshot-scan')}
            accessibilityRole="button"
            accessibilityLabel="Scan screenshots for hidden intentions"
          >
            <Icon name="ai" size={20} color={palette.electric} />
          </Pressable>
          <ProfileButton size={48} />
        </View>
      </View>

      {!profile.display_name && session ? <NamePrompt userId={session.user.id} /> : null}

      <DailyCommandCard
        doneToday={daily.doneToday}
        totalToday={daily.totalToday}
        weekCompleted={daily.weekCompleted}
        streak={profile.streak_count}
        focusSeconds={focusQuery.data?.todaySeconds ?? null}
      />

      {missionsQuery.isPending ? (
        <ActivityIndicator color={palette.electric} style={styles.loading} />
      ) : missionsQuery.isError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Couldn&rsquo;t load your missions.</Text>
          <Pressable
            onPress={() => void missionsQuery.refetch()}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : mainQuest ? (
        <>
          <MainQuestCard
            mission={mainQuest}
            onPress={() =>
              router.push({ pathname: '/(modals)/active-mission', params: { id: mainQuest.id } })
            }
          />
          {secondary.length > 0 ? (
            <View style={styles.secondaryList}>
              <Text style={styles.sectionLabel}>UP NEXT</Text>
              {secondary.map((mission) => (
                <MissionRow
                  key={mission.id}
                  mission={mission}
                  onPress={() =>
                    router.push({
                      pathname: '/(modals)/active-mission',
                      params: { id: mission.id },
                    })
                  }
                />
              ))}
            </View>
          ) : null}
          {topInsight ? (
            <View
              style={styles.insightCard}
              accessible
              accessibilityLabel={`Insight: ${topInsight.message}`}
            >
              <View style={styles.insightHeader}>
                <Icon name="ai" size={14} color={palette.electric} />
                <Text style={styles.insightKicker}>INSIGHT</Text>
              </View>
              <Text style={styles.insightText}>{topInsight.message}</Text>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="mainQuest" size={32} color={semantic.text.tertiary} />
          <Text style={styles.emptyTitle}>Your next achievement is waiting.</Text>
          <Pressable
            style={styles.emptyCta}
            onPress={() => router.push('/(modals)/create-mission')}
            accessibilityRole="button"
            accessibilityLabel="Create mission"
          >
            <Text style={styles.emptyCtaLabel}>Create Mission</Text>
          </Pressable>
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: space.xs,
  },
  greeting: {
    ...type.title,
    color: semantic.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  level: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.secondary,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: semantic.glass.fill8,
  },
  streakText: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.gold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  scanButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: withAlpha(palette.electric, 0.14),
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    ...type.title,
    fontSize: 18,
    color: semantic.text.primary,
  },
  wordmarkAccent: {
    color: palette.iris,
  },
  todayPanel: {
    padding: space.lg,
    gap: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.strong,
  },
  todayHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  sectionEyebrow: {
    ...type.data,
    color: palette.iris,
  },
  todayPercent: {
    ...type.data,
    color: semantic.text.primary,
  },
  todayProgressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: semantic.border.subtle,
  },
  todayProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  todaySummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  todayTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  todayValue: {
    ...type.title,
    fontSize: 20,
    color: semantic.text.primary,
  },
  todayLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  sectionLabel: {
    ...type.data,
    color: semantic.text.tertiary,
    marginTop: space.xs,
  },
  insightCard: {
    gap: space.xs,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: withAlpha(palette.electric, 0.08),
    borderWidth: 1,
    borderColor: withAlpha(palette.electric, 0.22),
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  insightKicker: {
    ...type.data,
    fontSize: 11,
    color: palette.electric,
  },
  insightText: {
    ...type.body,
    color: semantic.text.secondary,
  },
  loading: {
    marginTop: space.xl,
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
  secondaryList: {
    gap: space.sm,
  },
  emptyState: {
    alignItems: 'center',
    gap: space.md,
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
  emptyCta: {
    marginTop: space.xs,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  emptyCtaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
});
