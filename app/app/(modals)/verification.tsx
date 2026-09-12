import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LockDial } from '@/components/LockDial';
import { useProof } from '@/hooks/useProof';
import { useVerifyProof } from '@/hooks/useVerifyProof';
import { levelProgress } from '@/lib/leveling';
import { useAuth } from '@/state/auth';
import {
  fireHaptic,
  gradients,
  Icon,
  palette,
  radius,
  semantic,
  space,
  type,
  useReducedMotion,
  withAlpha,
} from '@/theme';

/**
 * AI Verification result (TODO.md §8.3, `LockedIn.md` Screen 12). Auto-triggers the real
 * `verify-proof` Edge Function call on mount — no fabricated verdict is ever shown; a genuine
 * network/deploy failure (real risk right now: the function isn't deployed anywhere reachable
 * from this build yet — see `useVerifyProof`'s doc comment) renders as its own distinct error
 * state, never disguised as a low-confidence AI result.
 *
 * The rejection path gets equal weight to the success path per §8.3/§9's "no shame" rule: a
 * low-confidence verdict reads as "let's take another look," not a failure screen, and always
 * offers a resubmit — nothing here ever flips the mission to a failed/red state.
 */
export default function VerificationModal() {
  const { proofId } = useLocalSearchParams<{ proofId: string }>();
  const insets = useSafeAreaInsets();
  const proofQuery = useProof(proofId);
  const { session, profile, refreshProfile } = useAuth();
  const verify = useVerifyProof(session?.user.id);
  const reducedMotion = useReducedMotion();
  const triggeredForRef = useRef<string | null>(null);
  // Captured once, before this verification could possibly award XP — the baseline a level-up is
  // measured against. A ref (not state) because re-renders from the level itself changing must not
  // reset it.
  const levelBeforeRef = useRef(profile?.level ?? 1);

  useEffect(() => {
    if (proofId && triggeredForRef.current !== proofId) {
      triggeredForRef.current = proofId;
      verify.mutate(proofId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-trigger only when proofId changes
  }, [proofId]);

  useEffect(() => {
    // Pull the fresh xp_total/level the moment the server has actually awarded XP — needed to
    // detect a level-up on the "Continue" tap below (see TODO.md §9's level-up moment).
    if (verify.data?.verified) void refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once per verdict, not on every refreshProfile identity change
  }, [verify.data?.verified]);

  useEffect(() => {
    if (verify.data?.verified) fireHaptic('missionComplete');
  }, [verify.data?.verified]);

  function handleContinue() {
    const newLevel = profile?.level ?? levelBeforeRef.current;
    if (newLevel > levelBeforeRef.current) {
      router.replace({ pathname: '/(modals)/level-up', params: { level: String(newLevel) } });
    } else {
      router.dismissAll();
    }
  }

  function handleResubmit() {
    if (proofQuery.data?.mission_id) {
      router.replace({
        pathname: '/(modals)/proof',
        params: { missionId: proofQuery.data.mission_id },
      });
    } else {
      router.back();
    }
  }

  const contentStyle = [
    styles.content,
    { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl },
  ];

  if (verify.isPending || verify.isIdle) {
    return (
      <View style={[styles.container, contentStyle]}>
        <ActivityIndicator color={palette.electric} size="large" />
        <Text style={styles.statusText}>Analyzing your evidence…</Text>
      </View>
    );
  }

  if (verify.isError) {
    return (
      <View style={[styles.container, contentStyle]}>
        <View style={styles.iconWrap}>
          <Icon name="pending" size={36} color={semantic.text.tertiary} />
        </View>
        <Text style={styles.resultTitle}>Couldn&rsquo;t Reach Verification</Text>
        <Text style={styles.reasoning}>
          The verification service didn&rsquo;t respond. Your proof was saved — try again in a
          moment.
        </Text>
        <Pressable
          style={styles.primaryButton}
          onPress={() => proofId && verify.mutate(proofId)}
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text style={styles.primaryButtonLabel}>Try Again</Text>
        </Pressable>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <Text style={styles.dismissLabel}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const verdict = verify.data;

  if (verdict?.verified) {
    const progress = profile ? levelProgress(profile.xp_total) : null;

    return (
      <View style={[styles.container, contentStyle]}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(400)}
          style={styles.centeredGroup}
        >
          <LockDial
            size={120}
            strokeWidth={5}
            progress={1}
            colors={gradients.elite}
            gradientId="verification-dial"
          >
            <View style={styles.lockBadge}>
              <Icon name="locked" size={30} color={palette.void} />
            </View>
          </LockDial>
          <Text style={styles.resultTitle}>Mission Locked In</Text>
          <Text style={styles.confidence}>{Math.round(verdict.confidence)}% confidence</Text>
          <Text style={styles.reasoning}>{verdict.reasoning}</Text>
          <View style={styles.xpChip}>
            <Icon name="xp" size={16} color={palette.gold} />
            <Text style={styles.xpText}>+{verdict.suggestedXp} XP</Text>
          </View>
          {progress ? (
            <View style={styles.progressGroup}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>
                  LVL {progress.level}
                  {profile?.identity_class ? ` · ${profile.identity_class.toUpperCase()}` : ''}
                </Text>
                {!!profile?.streak_count && profile.streak_count > 0 ? (
                  <View style={styles.streakChip}>
                    <Icon name="streak" size={12} color={palette.gold} />
                    <Text style={styles.streakText}>{profile.streak_count}</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.round(progress.progress * 100)}%` },
                  ]}
                />
              </View>
            </View>
          ) : null}
        </Animated.View>
        <Pressable
          style={styles.primaryButton}
          onPress={handleContinue}
          accessibilityRole="button"
          accessibilityLabel="Continue"
        >
          <Text style={styles.primaryButtonLabel}>Continue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, contentStyle]}>
      <View style={styles.iconWrap}>
        <Icon name="pending" size={36} color={semantic.text.secondary} />
      </View>
      <Text style={styles.resultTitle}>Let&rsquo;s Take Another Look</Text>
      {verdict ? (
        <Text style={styles.confidence}>{Math.round(verdict.confidence)}% confidence</Text>
      ) : null}
      <Text style={styles.reasoning}>
        {verdict?.reasoning ?? 'We couldn’t confirm this one — no worries, try resubmitting.'}
      </Text>
      <Pressable
        style={styles.primaryButton}
        onPress={handleResubmit}
        accessibilityRole="button"
        accessibilityLabel="Resubmit proof"
      >
        <Text style={styles.primaryButtonLabel}>Resubmit Proof</Text>
      </Pressable>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Maybe later"
      >
        <Text style={styles.dismissLabel}>Maybe Later</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
    alignItems: 'center',
    paddingHorizontal: space.xl,
  },
  content: {
    justifyContent: 'center',
    gap: space.md,
    width: '100%',
    flex: 1,
  },
  centeredGroup: {
    alignItems: 'center',
    gap: space.md,
  },
  statusText: {
    ...type.body,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  iconWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    ...type.display,
    color: semantic.text.primary,
    textAlign: 'center',
  },
  confidence: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  reasoning: {
    ...type.body,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    alignSelf: 'center',
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.gold, 0.14),
  },
  xpText: {
    ...type.bodyMedium,
    color: palette.gold,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.tile,
    backgroundColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressGroup: {
    width: '100%',
    maxWidth: 280,
    gap: space.xs,
    marginTop: space.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.tertiary,
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
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: semantic.border.subtle,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: palette.electric,
  },
  primaryButton: {
    marginTop: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  primaryButtonLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  dismissLabel: {
    ...type.body,
    color: semantic.text.tertiary,
    textAlign: 'center',
    marginTop: space.sm,
  },
});
