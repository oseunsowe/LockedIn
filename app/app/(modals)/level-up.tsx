import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  fireHaptic,
  fontFamily,
  gradients,
  Icon,
  palette,
  radius,
  semantic,
  space,
  type,
  useReducedMotion,
} from '@/theme';

/**
 * The full-screen level-up moment (TODO.md §9 P0: "the emotional payoff of the entire product").
 * Reached only from `verification.tsx` detecting a real level increase after XP was actually
 * awarded — the level number here is never guessed or animated toward a placeholder. No particle
 * system or sound: those need a dedicated effects/audio pass this session didn't build; the
 * gradient burst + spring-in + haptic are the real, honest version of "give it real budget" that
 * fits what's already in the theme layer (`spring.celebrate`, `hapticEvent.levelUp`).
 */
export default function LevelUpModal() {
  const { level } = useLocalSearchParams<{ level: string }>();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    fireHaptic('levelUp');
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[gradients.headline[0], gradients.headline[1], gradients.headline[2]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glowWash}
      />
      <View
        style={[
          styles.content,
          { paddingTop: insets.top + space.xxxl, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <Animated.View
          entering={reducedMotion ? undefined : ZoomIn.springify().damping(12).stiffness(140)}
          style={styles.centerGroup}
        >
          <View style={styles.iconWrap}>
            <Icon name="xp" size={40} color={palette.gold} />
          </View>
          <Text style={styles.kicker}>LEVEL UP</Text>
          <Text style={styles.levelText}>LEVEL {level}</Text>
          <Animated.Text
            entering={reducedMotion ? undefined : FadeIn.delay(200).duration(400)}
            style={styles.unlocked}
          >
            UNLOCKED
          </Animated.Text>
        </Animated.View>

        <Pressable
          style={styles.continueButton}
          onPress={() => router.dismissAll()}
          accessibilityRole="button"
          accessibilityLabel="Keep going"
        >
          <Text style={styles.continueLabel}>Keep Going</Text>
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
  glowWash: {
    ...StyleSheet.absoluteFill,
    opacity: 0.18,
  },
  content: {
    flex: 1,
    paddingHorizontal: space.xl,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: semantic.bg.surface,
    borderWidth: 2,
    borderColor: palette.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.md,
  },
  kicker: {
    ...type.data,
    color: palette.iris,
  },
  levelText: {
    fontFamily: fontFamily.displayExtraBold,
    fontSize: 56,
    lineHeight: 62,
    color: semantic.text.primary,
  },
  unlocked: {
    ...type.title,
    color: palette.gold,
  },
  continueButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
    marginBottom: space.lg,
  },
  continueLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
});
