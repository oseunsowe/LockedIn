import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MissionCard } from '@/components/MissionCard';
import { useActiveMissions } from '@/hooks/useActiveMissions';
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
} from '@/theme';

const sections: { type: Mission['type']; icon: IconName; label: string }[] = [
  { type: 'main', icon: 'mainQuest', label: 'MAIN QUEST' },
  { type: 'side', icon: 'side', label: 'SIDE MISSIONS' },
  { type: 'daily', icon: 'daily', label: 'DAILY CHALLENGES' },
];

export default function MissionBoard() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const missionsQuery = useActiveMissions(session?.user.id);
  const recoveryQuery = useRecoveryMissions(session?.user.id);
  const setMissionStatus = useSetMissionStatus(session?.user.id);
  const missions = missionsQuery.data ?? [];
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
        <Text style={styles.header}>Mission Board</Text>

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
            {sections.map((section) => {
              const sectionMissions = missions.filter((m) => m.type === section.type);
              if (sectionMissions.length === 0) return null;
              return (
                <View key={section.type} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Icon name={section.icon} size={16} color={semantic.text.tertiary} />
                    <Text style={styles.sectionLabel}>{section.label}</Text>
                    <Text style={styles.sectionCount}>{sectionMissions.length}</Text>
                  </View>
                  <View style={styles.sectionList}>
                    {sectionMissions.map((mission) => (
                      <MissionCard
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
                </View>
              );
            })}

            {recoveryMissions.length > 0 ? (
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
  header: {
    ...type.display,
    color: semantic.text.primary,
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
