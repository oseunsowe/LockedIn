import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProof } from '@/hooks/useProof';
import { useVerifyProof } from '@/hooks/useVerifyProof';
import { useAuth } from '@/state/auth';
import { Icon, palette, radius, semantic, space, type, useReducedMotion, withAlpha } from '@/theme';

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
    return (
      <View style={[styles.container, contentStyle]}>
        <Animated.View
          entering={reducedMotion ? undefined : FadeIn.duration(400)}
          style={styles.centeredGroup}
        >
          <View style={[styles.iconWrap, { backgroundColor: withAlpha(palette.gold, 0.16) }]}>
            <Icon name="verified" size={36} color={palette.gold} />
          </View>
          <Text style={styles.resultTitle}>MISSION VERIFIED</Text>
          <Text style={styles.confidence}>{Math.round(verdict.confidence)}% confidence</Text>
          <Text style={styles.reasoning}>{verdict.reasoning}</Text>
          <View style={styles.xpChip}>
            <Icon name="xp" size={16} color={palette.gold} />
            <Text style={styles.xpText}>+{verdict.suggestedXp} XP</Text>
          </View>
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
