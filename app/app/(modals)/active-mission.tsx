import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCountdown } from '@/hooks/useCountdown';
import { useMission } from '@/hooks/useMission';
import { useSetMissionStatus } from '@/hooks/useMissionStatus';
import { computeElapsedProgress } from '@/lib/time';
import { difficultyMeta, parseProofRequirements, type Mission } from '@/lib/missions';
import { useAuth } from '@/state/auth';
import {
  fontFamily,
  Icon,
  type IconName,
  palette,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

const typeMeta: Record<Mission['type'], { icon: IconName; label: string }> = {
  main: { icon: 'mainQuest', label: 'MAIN QUEST' },
  side: { icon: 'side', label: 'SIDE MISSION' },
  daily: { icon: 'daily', label: 'DAILY CHALLENGE' },
};

/** Unique tag so this screen's keep-awake lock can't be left held by, or clash with, anything else
 * that might call `expo-keep-awake` elsewhere later. */
const FOCUS_MODE_TAG = 'active-mission-focus';

/**
 * Active Mission Mode (TODO.md §7.3, `LockedIn.md` Screen 10). "Focus Mode" is scoped exactly as
 * the TODO calls for: an in-app immersive state (dimmed chrome + keep-awake), not OS-level Focus
 * integration or notification suppression — there's no notification system yet to suppress
 * (Phase 13), and true iOS Focus control is a native lift out of scope for MVP.
 */
export default function ActiveMissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const missionQuery = useMission(id);
  const setMissionStatus = useSetMissionStatus(session?.user.id);
  const [focusActive, setFocusActive] = useState(false);
  // Called unconditionally, before any early return below (Rules of Hooks) — `null` deadline is a
  // valid, handled input, so this is safe even before `missionQuery.data` exists.
  const countdown = useCountdown(missionQuery.data?.deadline ?? null);

  // Never leave the screen awake-lock held once this screen is gone, regardless of how it unmounts.
  useEffect(() => {
    return () => {
      void deactivateKeepAwake(FOCUS_MODE_TAG);
    };
  }, []);

  async function handleActivateRecovery() {
    if (!id) return;
    try {
      await setMissionStatus.mutateAsync({
        missionId: id,
        status: 'recovery',
        fromStatus: 'active',
      });
      router.back();
    } catch {
      // setMissionStatus.isError renders inline below — nothing else to do here.
    }
  }

  async function toggleFocusMode() {
    if (focusActive) {
      await deactivateKeepAwake(FOCUS_MODE_TAG);
      setFocusActive(false);
    } else {
      await activateKeepAwakeAsync(FOCUS_MODE_TAG);
      setFocusActive(true);
    }
  }

  if (missionQuery.isPending) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={palette.electric} />
      </View>
    );
  }

  if (missionQuery.isError || !missionQuery.data) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Couldn&rsquo;t load this mission.</Text>
        <Pressable
          style={styles.retryButton}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.retryLabel}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const mission = missionQuery.data;
  const meta = typeMeta[mission.type];
  const difficulty = difficultyMeta[mission.difficulty];
  const proofChips = parseProofRequirements(mission.proof_requirements);
  const elapsed = computeElapsedProgress(mission.created_at, mission.deadline);

  return (
    <View style={[styles.container, focusActive ? styles.containerFocus : null]}>
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
        <View style={styles.kickerRow}>
          <Icon name={meta.icon} size={16} color={palette.gold} />
          <Text style={styles.kicker}>{meta.label}</Text>
        </View>
        <Text style={styles.title}>{mission.title}</Text>
        <Text style={[styles.difficultyLabel, { color: difficulty.color }]}>
          {difficulty.label} Difficulty
        </Text>

        {countdown ? (
          <View style={styles.timerBlock}>
            <Text
              style={[styles.timer, countdown.overdue ? { color: semantic.state.warning } : null]}
            >
              {countdown.label}
            </Text>
            <Text style={styles.timerLabel}>{countdown.overdue ? 'OVERDUE' : 'REMAINING'}</Text>
          </View>
        ) : (
          <View style={styles.timerBlock}>
            <Text style={styles.noDeadline}>No deadline — take your time.</Text>
          </View>
        )}

        {countdown?.overdue ? (
          <View style={styles.recoveryCard}>
            <Text style={styles.recoveryTitle}>This one slipped past its deadline.</Text>
            <Text style={styles.recoveryBody}>
              No big deal — activate Recovery Mode to reset it and keep going. Your streak
              isn&rsquo;t broken over this.
            </Text>
            <Pressable
              style={styles.recoveryButton}
              onPress={() => void handleActivateRecovery()}
              disabled={setMissionStatus.isPending}
              accessibilityRole="button"
              accessibilityLabel="Activate Recovery Mode"
              accessibilityState={{ disabled: setMissionStatus.isPending }}
            >
              <Text style={styles.recoveryButtonLabel}>
                {setMissionStatus.isPending ? 'Activating…' : 'Activate Recovery Mode'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {elapsed !== null ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${elapsed}%` }]} />
            </View>
            <Text style={styles.progressLabel}>{Math.round(elapsed)}% TIME ELAPSED</Text>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PROOF REQUIRED</Text>
          {proofChips.length > 0 ? (
            <View style={styles.checklist}>
              {proofChips.map((chip) => (
                <View key={chip.type} style={styles.checklistRow}>
                  <View style={styles.checklistDot} />
                  <Icon name={chip.icon} size={16} color={semantic.text.secondary} />
                  <Text style={styles.checklistLabel}>{chip.label}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noProof}>No proof required — submit anytime.</Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <View style={styles.controlsRow}>
          <View style={[styles.controlButton, styles.controlButtonDisabled]}>
            <Icon name="timer" size={16} color={semantic.text.tertiary} />
            <Text style={styles.controlLabelDisabled}>Pause</Text>
            <Text style={styles.soonBadge}>SOON</Text>
          </View>
          <Pressable
            style={[styles.controlButton, focusActive ? styles.controlButtonFocusActive : null]}
            onPress={() => void toggleFocusMode()}
            accessibilityRole="button"
            accessibilityLabel="Focus Mode"
            accessibilityState={{ selected: focusActive }}
          >
            <Icon
              name="locked"
              size={16}
              color={focusActive ? palette.gold : semantic.text.secondary}
            />
            <Text style={[styles.controlLabel, focusActive ? { color: palette.gold } : null]}>
              {focusActive ? 'Focus Active' : 'Focus Mode'}
            </Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.submitButton}
          onPress={() =>
            router.push({ pathname: '/(modals)/proof', params: { missionId: mission.id } })
          }
          accessibilityRole="button"
          accessibilityLabel="Submit proof"
        >
          <Text style={styles.submitLabel}>Submit Proof</Text>
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
  containerFocus: {
    backgroundColor: palette.void,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
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
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  kicker: {
    ...type.data,
    color: palette.gold,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
    textAlign: 'center',
  },
  difficultyLabel: {
    ...type.caption,
  },
  timerBlock: {
    alignItems: 'center',
    marginTop: space.xl,
    gap: space.xs,
  },
  timer: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 48,
    color: semantic.text.primary,
  },
  timerLabel: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  noDeadline: {
    ...type.body,
    color: semantic.text.secondary,
  },
  recoveryCard: {
    width: '100%',
    marginTop: space.lg,
    gap: space.sm,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: withAlpha(palette.violet, 0.1),
    borderWidth: 1,
    borderColor: withAlpha(palette.violet, 0.3),
  },
  recoveryTitle: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  recoveryBody: {
    ...type.caption,
    color: semantic.text.secondary,
  },
  recoveryButton: {
    marginTop: space.xs,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.md,
    borderRadius: radius.pill,
    backgroundColor: palette.violet,
  },
  recoveryButtonLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  progressBlock: {
    width: '100%',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.md,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.border.subtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: palette.electric,
  },
  progressLabel: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  section: {
    width: '100%',
    marginTop: space.xxl,
    gap: space.md,
  },
  sectionLabel: {
    ...type.data,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  checklist: {
    gap: space.sm,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.md,
  },
  checklistDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: semantic.border.strong,
  },
  checklistLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  noProof: {
    ...type.caption,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.md,
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    backgroundColor: semantic.bg.surface,
  },
  controlButtonDisabled: {
    opacity: 0.6,
  },
  controlButtonFocusActive: {
    borderColor: palette.gold,
    backgroundColor: withAlpha(palette.gold, 0.12),
  },
  controlLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.secondary,
  },
  controlLabelDisabled: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.tertiary,
  },
  soonBadge: {
    ...type.data,
    fontSize: 9,
    color: palette.iris,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  submitLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
});
