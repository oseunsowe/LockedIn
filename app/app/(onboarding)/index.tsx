import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DisplayHeading } from '@/components/DisplayHeading';
import { Icon, glow, gradients, palette, radius, semantic, space, type } from '@/theme';

/**
 * Welcome — functional, on-brand, but not pixel-matched to onboard_screen_0/1/2/3.JPG
 * (no XP ring animation, particle field, or floating chips yet — that's Phase 5).
 */
export default function Welcome() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      <View style={styles.hero}>
        <View style={styles.mark}>
          <Icon name="locked" size={40} color={semantic.action.primary} />
        </View>
        <DisplayHeading line1="Become the person" line2="you promised." />
        <Text style={styles.subtitle}>
          Create commitments, prove progress, and level up your life.
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/(onboarding)/identity')}>
          <LinearGradient
            colors={gradients.xp}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.primaryCta, glow(palette.electric)]}
          >
            <Text style={styles.primaryCtaLabel}>Start My Journey</Text>
          </LinearGradient>
        </Pressable>

        <View style={styles.secondaryRow}>
          <Pressable style={styles.secondaryCta} disabled>
            <Icon name="screenshot" size={16} color={semantic.text.tertiary} />
            <Text style={styles.secondaryCtaLabel}>Import Screenshots</Text>
          </Pressable>
          <Pressable style={styles.secondaryCta} disabled>
            <Icon name="voice" size={16} color={semantic.text.tertiary} />
            <Text style={styles.secondaryCtaLabel}>Speak My Goals</Text>
          </Pressable>
        </View>
        <Text style={styles.secondaryNote}>
          Screenshot Intelligence and voice capture land in Phase 5 (TODO.md) — disabled for now.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
    paddingHorizontal: space.xl,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'flex-start',
    gap: space.md,
  },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radius.tile,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  subtitle: {
    ...type.body,
    color: semantic.text.secondary,
  },
  actions: {
    gap: space.md,
  },
  primaryCta: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
  },
  primaryCtaLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  secondaryCta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.md,
    borderRadius: radius.pill,
    backgroundColor: semantic.bg.surface,
    opacity: 0.5,
  },
  secondaryCtaLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  secondaryNote: {
    ...type.caption,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
});
