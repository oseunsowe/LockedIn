import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { OnboardingStep } from '@/components/OnboardingStep';
import { Icon, semantic, space, type } from '@/theme';

/**
 * Stand-in for LockedIn.md Screen 5 (staged AI profile-generation animation). Real version
 * must never block on the network (TODO.md §5.4) — this stub already models that: it completes
 * instantly and locally, no network call at all yet.
 *
 * Still step 4 of 4 — auth (next screen) is deliberately NOT a numbered step. TODO.md §5.5:
 * "Place it after the value is shown (post-step-4), not before step 1," and the mockups'
 * "STEP 3 OF 4" labels are pixel authority for exactly 4 steps.
 */
export default function Generating() {
  return (
    <OnboardingStep
      step={4}
      totalSteps={4}
      title="Building your plan"
      subtitle="Your AI-generated mission strategy is ready."
      ctaLabel="Continue"
      onCta={() => router.push('/(onboarding)/auth')}
    >
      <View style={styles.summary}>
        <Icon name="ai" size={28} color={semantic.action.primary} />
        <Text style={styles.summaryTitle}>Profile generated</Text>
        <Text style={styles.summaryBody}>
          Class, strengths, and a recommended mission mode — computed locally for now. Real
          server-backed generation lands with Phase 4/5.
        </Text>
      </View>
    </OnboardingStep>
  );
}

const styles = StyleSheet.create({
  summary: {
    backgroundColor: semantic.bg.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.lg,
    gap: space.xs,
    alignItems: 'flex-start',
  },
  summaryTitle: {
    ...type.title,
    color: semantic.text.primary,
    marginTop: space.sm,
  },
  summaryBody: {
    ...type.body,
    color: semantic.text.secondary,
  },
});
