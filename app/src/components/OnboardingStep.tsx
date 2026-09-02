import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { glow, gradients, palette, radius, semantic, space, type } from '@/theme';

type OnboardingStepProps = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  ctaLabel: string;
  ctaDisabled?: boolean;
  onCta: () => void;
};

/**
 * Shared chrome for the 4 onboarding steps: progress bar, step label, title/subtitle, content
 * slot, gradient CTA. Functional and on-brand, but NOT pixel-matched to the mockups — no ring
 * animation, particle field, or floating XP chips. That's real Phase 5 work; see TODO.md §5.
 */
export function OnboardingStep({
  step,
  totalSteps,
  title,
  subtitle,
  children,
  ctaLabel,
  ctaDisabled,
  onCta,
}: OnboardingStepProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + space.lg }]}>
        <View style={styles.progressTrack}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i < step ? styles.progressSegmentActive : null]}
            />
          ))}
        </View>
        <Text style={styles.stepLabel}>
          STEP {step} OF {totalSteps}
        </Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.body}>{children}</View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + space.lg }]}>
        <Pressable onPress={onCta} disabled={ctaDisabled}>
          {ctaDisabled ? (
            <View style={[styles.cta, styles.ctaDisabled]}>
              <Text style={styles.ctaLabelDisabled}>{ctaLabel}</Text>
            </View>
          ) : (
            <LinearGradient
              colors={gradients.xp}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.cta, glow(palette.electric)]}
            >
              <Text style={styles.ctaLabel}>{ctaLabel}</Text>
            </LinearGradient>
          )}
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
    paddingBottom: space.xxxl,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: space.xs,
    marginBottom: space.lg,
  },
  progressSegment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: semantic.border.subtle,
  },
  progressSegmentActive: {
    backgroundColor: semantic.action.primary,
  },
  stepLabel: {
    ...type.data,
    color: semantic.text.tertiary,
    marginBottom: space.sm,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
    marginBottom: space.xs,
  },
  subtitle: {
    ...type.body,
    color: semantic.text.secondary,
    marginBottom: space.xl,
  },
  body: {
    gap: space.md,
  },
  footer: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
  },
  cta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
  },
  ctaDisabled: {
    backgroundColor: semantic.bg.surface,
  },
  ctaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  ctaLabelDisabled: {
    ...type.bodyMedium,
    color: semantic.text.tertiary,
  },
});
