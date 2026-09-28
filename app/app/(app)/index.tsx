import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
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

import { Avatar } from '@/components/Avatar';
import { ExecutionScoreRing } from '@/components/ExecutionScoreRing';
import { MainQuestCard } from '@/components/MainQuestCard';
import { MissionRow } from '@/components/MissionRow';
import { NamePrompt } from '@/components/NamePrompt';
import { XpBar } from '@/components/XpBar';
import { useActiveMissions } from '@/hooks/useActiveMissions';
import { demoTodayStats } from '@/lib/demoData';
import { useDemoMode } from '@/lib/demoMode';
import { pickMainQuest } from '@/lib/missions';
import { useAuth } from '@/state/auth';
import { Icon, type IconName, palette, radius, semantic, space, type, withAlpha } from '@/theme';

function TodayTile({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return (
    <View style={styles.todayTile}>
      <Icon name={icon} size={16} color={palette.iris} />
      <Text style={styles.todayValue}>{value}</Text>
      <Text style={styles.todayLabel}>{label}</Text>
    </View>
  );
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

/** "Today's Performance" strip. Demo-only for now: the app doesn't yet aggregate real per-day
 * stats (missions done today, XP today, focus minutes — Focus Mode isn't persisted). */
function TodayStrip({ seed }: { seed: number }) {
  const today = demoTodayStats(seed);
  const completion = today.missionsTotal > 0 ? today.missionsDone / today.missionsTotal : 0;
  return (
    <View style={styles.todayPanel}>
      <View style={styles.todayHeading}>
        <View style={styles.todayTitleRow}>
          <Text style={styles.sectionEyebrow}>TODAY</Text>
          <Icon name="sun" size={18} color={palette.gold} />
        </View>
        <Text style={styles.todayPercent}>{Math.round(completion * 100)}%</Text>
      </View>
      <View style={styles.todayProgressTrack}>
        <LinearGradient
          colors={[palette.electric, palette.violet]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.todayProgressFill, { width: `${Math.round(completion * 100)}%` }]}
        />
      </View>
      <View style={styles.todaySummary}>
        <View>
          <Text style={styles.todayValue}>
            {today.missionsDone} / {today.missionsTotal}
          </Text>
          <Text style={styles.todayLabel}>missions complete</Text>
        </View>
        <TodayTile icon="xp" value={`+${today.xpToday}`} label="XP earned" />
        <TodayTile icon="timer" value={`${today.focusMinutes}m`} label="focus time" />
      </View>
    </View>
  );
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const missionsQuery = useActiveMissions(session?.user.id);
  const demo = useDemoMode();

  // AppGate (app/_layout.tsx) never renders this route until `profile` resolves — this guard is
  // just cheap insurance against a Fast Refresh edge case, not a real steady-state path.
  if (!profile) return null;

  const displayName = profile.display_name ?? 'there';
  const { mainQuest, secondary } = pickMainQuest(missionsQuery.data ?? []);

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
          <Pressable
            onPress={() => router.push('/(app)/profile')}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
          >
            <Avatar uri={profile.avatar_url} name={profile.display_name} size={48} />
          </Pressable>
        </View>
      </View>

      {!profile.display_name && session ? <NamePrompt userId={session.user.id} /> : null}

      <View style={styles.ringWrap}>
        <ExecutionScoreRing score={profile.execution_score} />
      </View>

      {demo.enabled ? <TodayStrip seed={demo.seed} /> : null}

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
  ringWrap: {
    alignItems: 'center',
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
