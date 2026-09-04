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

import { ExecutionScoreRing } from '@/components/ExecutionScoreRing';
import { MainQuestCard } from '@/components/MainQuestCard';
import { MissionRow } from '@/components/MissionRow';
import { XpBar } from '@/components/XpBar';
import { useActiveMissions } from '@/hooks/useActiveMissions';
import { pickMainQuest } from '@/lib/missions';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type } from '@/theme';

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

  // AppGate (app/_layout.tsx) never renders this route until `profile` resolves — this guard is
  // just cheap insurance against a Fast Refresh edge case, not a real steady-state path.
  if (!profile) return null;

  const displayName = profile.display_name ?? session?.user.email?.split('@')[0] ?? 'there';
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
        <View style={styles.avatar}>
          <Icon name="profile" size={28} color={semantic.text.secondary} />
        </View>
      </View>

      <View style={styles.ringWrap}>
        <ExecutionScoreRing score={profile.execution_score} />
      </View>

      {missionsQuery.isPending ? (
        <ActivityIndicator color={palette.electric} style={styles.loading} />
      ) : missionsQuery.isError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Couldn&rsquo;t load your missions.</Text>
          <Pressable onPress={() => void missionsQuery.refetch()} style={styles.retryButton}>
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
