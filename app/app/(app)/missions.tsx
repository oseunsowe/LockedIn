import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MissionCard } from '@/components/MissionCard';
import { ProfileButton } from '@/components/ProfileButton';
import { useActiveMissions } from '@/hooks/useActiveMissions';
import { useMissionHistory } from '@/hooks/useMissionHistory';
import { useSetMissionStatus } from '@/hooks/useMissionStatus';
import { useRecoveryMissions } from '@/hooks/useRecoveryMissions';
import type { Mission } from '@/lib/missions';
import { hoursFromNow } from '@/lib/time';
import { useAuth } from '@/state/auth';
import {
  glow,
  gradients,
  Icon,
  type IconName,
  palette,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

type BoardFilter = 'all' | 'active' | 'upcoming' | 'completed';

const filters: { key: BoardFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

const emptyCopy: Record<BoardFilter, string> = {
  all: 'No missions yet.',
  active: 'Nothing active right now.',
  upcoming: 'No upcoming missions. Schedule one with a time block.',
  completed: 'No completed missions yet — your first verified win lands here.',
};

const typeRank: Record<Mission['type'], number> = { main: 0, side: 1, daily: 2 };

/** Active = live now; Up next = time-blocked to start later. Main quests lead, then by deadline. */
function splitByStart(list: Mission[]): { activeNow: Mission[]; upcoming: Mission[] } {
  const now = Date.now();
  const byPriority = (x: Mission, y: Mission) =>
    typeRank[x.type] - typeRank[y.type] ||
    (x.deadline ?? '9999').localeCompare(y.deadline ?? '9999');
  const isLater = (mission: Mission) =>
    mission.start_time !== null && new Date(mission.start_time).getTime() > now;
  return {
    activeNow: list.filter((mission) => !isLater(mission)).sort(byPriority),
    upcoming: list
      .filter(isLater)
      .sort((x, y) => (x.start_time ?? '').localeCompare(y.start_time ?? '')),
  };
}

export default function MissionBoard() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const missionsQuery = useActiveMissions(session?.user.id);
  const recoveryQuery = useRecoveryMissions(session?.user.id);
  const setMissionStatus = useSetMissionStatus(session?.user.id);
  const historyQuery = useMissionHistory(session?.user.id);
  const [filter, setFilter] = useState<BoardFilter>('all');
  const missions = missionsQuery.data ?? [];
  const { activeNow, upcoming } = splitByStart(missions);
  const completed = (historyQuery.data ?? [])
    .filter((mission) => mission.status === 'completed')
    .slice(0, 12);
  const showActive = filter === 'all' || filter === 'active';
  const showUpcoming = filter === 'all' || filter === 'upcoming';
  const showCompleted = filter === 'all' || filter === 'completed';
  const filterEmpty =
    (showActive ? activeNow.length : 0) +
      (showUpcoming ? upcoming.length : 0) +
      (showCompleted ? completed.length : 0) ===
    0;

  function renderSection(label: string, icon: IconName, list: Mission[]) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name={icon} size={16} color={semantic.text.tertiary} />
          <Text style={styles.sectionLabel}>{label}</Text>
          <Text style={styles.sectionCount}>{list.length}</Text>
        </View>
        <View style={styles.sectionList}>
          {list.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onPress={() =>
                router.push({ pathname: '/(modals)/active-mission', params: { id: mission.id } })
              }
            />
          ))}
        </View>
      </View>
    );
  }
  const recoveryMissions = recoveryQuery.data ?? [];

  function resumeMission(missionId: string) {
    // A fresh 24h window — the old deadline already passed, so re-activating with it unchanged
    // would just be instantly overdue again.
    setMissionStatus.mutate({
      missionId,
      status: 'active',
      fromStatus: 'recovery',
      deadline: hoursFromNow(24),
    });
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.xxxl * 2 },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.header}>Mission Board</Text>
          <View style={styles.headerActions}>
            <ProfileButton />
          </View>
        </View>

        <View style={styles.filterRow} accessibilityRole="tablist">
          {filters.map((item) => {
            const selected = filter === item.key;
            return (
              <Pressable
                key={item.key}
                style={[styles.filterChip, selected ? styles.filterChipSelected : null]}
                onPress={() => setFilter(item.key)}
                accessibilityRole="tab"
                accessibilityLabel={`Show ${item.label.toLowerCase()} missions`}
                accessibilityState={{ selected }}
              >
                <Text style={[styles.filterLabel, selected ? styles.filterLabelSelected : null]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

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
        ) : missions.length === 0 && recoveryMissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="missions" size={32} color={semantic.text.tertiary} />
            <Text style={styles.emptyTitle}>No active missions yet.</Text>
            <Text style={styles.emptySubtitle}>
              Create your first one — pick a goal, set the difficulty, and lock it in.
            </Text>
          </View>
        ) : (
          <>
            {showActive && activeNow.length > 0
              ? renderSection('ACTIVE', 'mainQuest', activeNow)
              : null}
            {showUpcoming && upcoming.length > 0
              ? renderSection('UP NEXT', 'timeline', upcoming)
              : null}
            {showCompleted && completed.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="verified" size={16} color={semantic.state.success} />
                  <Text style={styles.sectionLabel}>COMPLETED</Text>
                  <Text style={styles.sectionCount}>{completed.length}</Text>
                </View>
                <View style={styles.sectionList}>
                  {completed.map((mission) => (
                    <View
                      key={mission.id}
                      style={styles.completedRow}
                      accessible
                      accessibilityLabel={`Completed: ${mission.title}, plus ${mission.xp_reward} XP`}
                    >
                      <Icon name="verified" size={18} color={semantic.state.success} />
                      <Text style={styles.completedTitle} numberOfLines={1}>
                        {mission.title}
                      </Text>
                      <Text style={styles.completedXp}>+{mission.xp_reward} XP</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
            {filterEmpty ? (
              <View style={styles.emptyState}>
                <Icon name="missions" size={32} color={semantic.text.tertiary} />
                <Text style={styles.emptyTitle}>{emptyCopy[filter]}</Text>
              </View>
            ) : null}

            {showActive && recoveryMissions.length > 0 ? (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="pending" size={16} color={palette.violet} />
                  <Text style={[styles.sectionLabel, { color: palette.violet }]}>
                    RECOVERY MODE
                  </Text>
                  <Text style={styles.sectionCount}>{recoveryMissions.length}</Text>
                </View>
                <View style={styles.sectionList}>
                  {recoveryMissions.map((mission) => (
                    <View key={mission.id} style={styles.recoveryRow}>
                      <View style={styles.recoveryRowBody}>
                        <Text style={styles.recoveryRowTitle} numberOfLines={1}>
                          {mission.title}
                        </Text>
                        <Text style={styles.recoveryRowSubtitle}>
                          Ready when you are — no rush.
                        </Text>
                      </View>
                      <Pressable
                        style={styles.resumeButton}
                        onPress={() => resumeMission(mission.id)}
                        disabled={setMissionStatus.isPending}
                        accessibilityRole="button"
                        accessibilityLabel={`Resume ${mission.title}`}
                        accessibilityState={{ disabled: setMissionStatus.isPending }}
                      >
                        <Text style={styles.resumeButtonLabel}>Resume</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable
          onPress={() => router.push('/(modals)/create-mission')}
          accessibilityRole="button"
          accessibilityLabel="Create new mission"
        >
          <LinearGradient
            colors={gradients.xp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.newMissionCta, glow(palette.electric)]}
          >
            <Icon name="mainQuest" size={16} color={semantic.text.onAccent} />
            <Text style={styles.newMissionLabel}>New Mission</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  filterChip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  filterChipSelected: {
    backgroundColor: withAlpha(palette.electric, 0.16),
    borderColor: palette.electric,
  },
  filterLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.secondary,
  },
  filterLabelSelected: {
    color: semantic.text.primary,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.tile,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  completedTitle: {
    ...type.body,
    flex: 1,
    color: semantic.text.secondary,
  },
  completedXp: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.gold,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  header: {
    ...type.display,
    color: semantic.text.primary,
  },
  timelineButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
  section: {
    gap: space.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  sectionLabel: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  sectionCount: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.tertiary,
    marginLeft: -space.xs,
  },
  sectionList: {
    gap: space.md,
  },
  recoveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  recoveryRowBody: {
    flex: 1,
    gap: 2,
  },
  recoveryRowTitle: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  recoveryRowSubtitle: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  resumeButton: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: palette.violet,
  },
  resumeButtonLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.onAccent,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
    backgroundColor: semantic.bg.canvas,
  },
  newMissionCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.md,
    borderRadius: radius.pill,
  },
  newMissionLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
});
