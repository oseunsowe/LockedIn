import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ExecutionScoreRing } from '@/components/ExecutionScoreRing';
import { XpBar } from '@/components/XpBar';
import { useAchievements } from '@/hooks/useAchievements';
import { useMissionHistory } from '@/hooks/useMissionHistory';
import { useProgressStats } from '@/hooks/useProgressStats';
import type { Mission } from '@/lib/missions';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

const missionStatusMeta: Record<Mission['status'], { label: string; color: string }> = {
  active: { label: 'Active', color: palette.electric },
  completed: { label: 'Completed', color: semantic.state.success },
  // "Failed" never appears in this app's UI-facing flow today (overdue missions go straight to
  // Recovery Mode — see TODO.md §9), but the enum value exists in the schema, so this is handled
  // defensively with the same no-shame tone rather than left to render undefined.
  failed: { label: 'Missed', color: semantic.state.warning },
  recovery: { label: 'Recovery', color: palette.violet },
};

function StatTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </View>
  );
}

/**
 * Progress Profile (TODO.md §11, `LockedIn.md` Screen 13). Reuses the Dashboard's exact
 * `ExecutionScoreRing`/`XpBar` components rather than re-deriving similar-looking ones — TODO.md's
 * own note is that this screen's stats "must read as one system with the dashboard rings."
 * "Focus" from the spec's stat list is cut — see `src/lib/progressStats.ts`'s doc comment for why
 * (Focus Mode usage is never persisted, so there's no real data to show a number for).
 */
export default function ProgressProfile() {
  const insets = useSafeAreaInsets();
  const { session, profile } = useAuth();
  const statsQuery = useProgressStats(session?.user.id);
  const achievementsQuery = useAchievements(session?.user.id);
  const historyQuery = useMissionHistory(session?.user.id);

  // AppGate never renders (app) routes until `profile` resolves — see app/(app)/index.tsx's
  // identical guard comment.
  if (!profile) return null;

  const displayName = profile.display_name ?? session?.user.email?.split('@')[0] ?? 'there';
  const stats = statsQuery.data;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxxl },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Icon name="profile" size={36} color={semantic.text.secondary} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.levelLine}>
          LEVEL {profile.level}
          {profile.identity_class ? ` · ${profile.identity_class.toUpperCase()}` : ''}
        </Text>
        <View style={styles.xpBarWrap}>
          <XpBar totalXp={profile.xp_total} />
        </View>
      </View>

      <View style={styles.ringWrap}>
        <ExecutionScoreRing score={profile.execution_score} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>STATS</Text>
        {statsQuery.isPending ? (
          <ActivityIndicator color={palette.electric} />
        ) : statsQuery.isError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>Couldn&rsquo;t load your stats.</Text>
            <Pressable style={styles.retryButton} onPress={() => void statsQuery.refetch()}>
              <Text style={styles.retryLabel}>Try again</Text>
            </Pressable>
          </View>
        ) : stats ? (
          <View style={styles.statsGrid}>
            <StatTile label="Consistency" value={`${stats.consistencyPct}%`} sub="last 30 days" />
            <StatTile
              label="Completion"
              value={stats.completionRatePct !== null ? `${stats.completionRatePct}%` : '—'}
              sub={stats.completionRatePct !== null ? 'all-time' : 'no history yet'}
            />
            <StatTile
              label="This Week"
              value={
                stats.growthTrend.growthTrendPct !== null
                  ? `${stats.growthTrend.growthTrendPct >= 0 ? '+' : ''}${stats.growthTrend.growthTrendPct}%`
                  : `${stats.growthTrend.thisWeekXp} XP`
              }
              sub={
                stats.growthTrend.growthTrendPct !== null ? 'vs last week' : 'not enough history'
              }
            />
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        {achievementsQuery.isPending ? (
          <ActivityIndicator color={palette.electric} />
        ) : (
          <View style={styles.achievementsGrid}>
            {(achievementsQuery.data ?? []).map((achievement) => (
              <View key={achievement.key} style={styles.achievementTile}>
                <View
                  style={[
                    styles.achievementIconWrap,
                    achievement.unlocked ? styles.achievementIconWrapUnlocked : null,
                  ]}
                >
                  <Icon
                    name={achievement.unlocked ? achievement.icon : 'locked'}
                    size={22}
                    color={achievement.unlocked ? palette.gold : semantic.text.tertiary}
                  />
                </View>
                <Text style={styles.achievementLabel} numberOfLines={2}>
                  {achievement.label}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>MISSION HISTORY</Text>
        {historyQuery.isPending ? (
          <ActivityIndicator color={palette.electric} />
        ) : (historyQuery.data ?? []).length === 0 ? (
          <Text style={styles.emptyHistory}>
            No completed missions yet — your history builds up as you finish them.
          </Text>
        ) : (
          <View style={styles.historyList}>
            {(historyQuery.data ?? []).map((mission) => {
              const meta = missionStatusMeta[mission.status];
              const date = new Date(mission.completed_at ?? mission.created_at);
              return (
                <View key={mission.id} style={styles.historyRow}>
                  <View style={styles.historyRowBody}>
                    <Text style={styles.historyTitle} numberOfLines={1}>
                      {mission.title}
                    </Text>
                    <Text style={styles.historyDate}>
                      {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <View
                    style={[styles.statusChip, { backgroundColor: withAlpha(meta.color, 0.16) }]}
                  >
                    <Text style={[styles.statusChipLabel, { color: meta.color }]}>
                      {meta.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
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
    gap: space.xxl,
  },
  header: {
    alignItems: 'center',
    gap: space.xs,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  name: {
    ...type.title,
    color: semantic.text.primary,
  },
  levelLine: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.secondary,
  },
  xpBarWrap: {
    width: '60%',
    marginTop: space.sm,
  },
  ringWrap: {
    alignItems: 'center',
  },
  section: {
    gap: space.md,
  },
  sectionLabel: {
    ...type.data,
    color: semantic.text.tertiary,
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
  statsGrid: {
    flexDirection: 'row',
    gap: space.sm,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  statValue: {
    ...type.title,
    color: semantic.text.primary,
  },
  statLabel: {
    ...type.caption,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  statSub: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.md,
  },
  achievementTile: {
    width: 88,
    alignItems: 'center',
    gap: space.xs,
  },
  achievementIconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.tile,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementIconWrapUnlocked: {
    borderColor: withAlpha(palette.gold, 0.4),
    backgroundColor: withAlpha(palette.gold, 0.12),
  },
  achievementLabel: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  emptyHistory: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  historyList: {
    gap: space.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.tile,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  historyRowBody: {
    flex: 1,
    gap: 2,
  },
  historyTitle: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  historyDate: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  statusChip: {
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
  },
  statusChipLabel: {
    ...type.data,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0,
  },
});
