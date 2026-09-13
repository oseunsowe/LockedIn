import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { rankForLevel, rankMilestones } from '@/lib/leveling';
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
  withAlpha,
} from '@/theme';

/** Zero-pads and space-groups a real XP total into the HUD-style "0000 0000 0106" readout. */
function formatXpReadout(xpTotal: number): string {
  const padded = Math.max(0, Math.trunc(xpTotal)).toString().padStart(12, '0');
  return padded.match(/.{1,4}/g)!.join(' ');
}

/**
 * The full-screen level-up moment (TODO.md §9 P0: "the emotional payoff of the entire product").
 * Reached only from `verification.tsx` detecting a real level increase after XP was actually
 * awarded — the level number here is never guessed or animated toward a placeholder. No particle
 * system or sound: those need a dedicated effects/audio pass this session didn't build; the
 * gradient burst + spring-in + haptic are the real, honest version of "give it real budget" that
 * fits what's already in the theme layer (`spring.celebrate`, `hapticEvent.levelUp`).
 *
 * Redesigned as a "stat card" (real level/XP/streak, an original LockedIn rank title layered over
 * the real numeric level — see `rankForLevel`) with a native share sheet, rather than just a bare
 * level number — no new native dependency: `Share.share()` is core React Native, so this works the
 * same in Expo Go as in a dev-client build.
 */
export default function LevelUpModal() {
  const { level, xpTotal, streak } = useLocalSearchParams<{
    level: string;
    xpTotal?: string;
    streak?: string;
  }>();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const levelNum = Number(level) || 1;
  const rank = rankForLevel(levelNum);
  const xpNum = Number(xpTotal) || 0;
  const streakNum = Number(streak) || 0;
  const milestones = rankMilestones();

  useEffect(() => {
    fireHaptic('levelUp');
  }, []);

  function handleShare() {
    void Share.share({
      message: `I just hit Level ${levelNum} (${rank}) on LockedIn — ${xpNum.toLocaleString()} XP and a ${streakNum}-day streak.`,
    });
  }

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
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={reducedMotion ? undefined : ZoomIn.springify().damping(12).stiffness(140)}
            style={styles.centerGroup}
          >
            <Text style={styles.kicker}>LEVEL UP</Text>
            <Text style={styles.levelText}>LEVEL {levelNum}</Text>
            <Animated.Text
              entering={reducedMotion ? undefined : FadeIn.delay(150).duration(400)}
              style={styles.rankText}
            >
              {rank.toUpperCase()}
            </Animated.Text>

            <Animated.View
              entering={reducedMotion ? undefined : FadeIn.delay(250).duration(400)}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Icon name="xp" size={18} color={palette.gold} />
                <Text style={styles.cardBrand}>LOCKEDIN</Text>
              </View>
              <Text style={styles.cardXpLabel}>LIFETIME XP</Text>
              <Text style={styles.cardXpValue}>{formatXpReadout(xpNum)}</Text>
              <View style={styles.cardStatsRow}>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>LEVEL</Text>
                  <Text style={styles.cardStatValue}>{levelNum}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>RANK</Text>
                  <Text style={styles.cardStatValue}>{rank}</Text>
                </View>
                <View style={styles.cardStat}>
                  <Text style={styles.cardStatLabel}>STREAK</Text>
                  <Text style={styles.cardStatValue}>{streakNum}d</Text>
                </View>
              </View>
            </Animated.View>

            <Pressable
              style={styles.shareButton}
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share your level card"
            >
              <Icon name="share" size={16} color={semantic.text.secondary} />
              <Text style={styles.shareLabel}>Share Card</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            entering={reducedMotion ? undefined : FadeIn.delay(350).duration(400)}
            style={styles.journey}
          >
            <Text style={styles.journeyHeading}>Journey</Text>
            {milestones.map((milestone) => {
              const reached = levelNum >= milestone.level;
              const current = rank === milestone.rank;
              return (
                <View key={milestone.rank} style={styles.journeyRow}>
                  <View
                    style={[
                      styles.journeyBadge,
                      current
                        ? styles.journeyBadgeCurrent
                        : reached
                          ? styles.journeyBadgeReached
                          : null,
                    ]}
                  >
                    <Icon
                      name="locked"
                      size={16}
                      color={
                        current
                          ? palette.electric
                          : reached
                            ? semantic.text.primary
                            : semantic.text.tertiary
                      }
                    />
                  </View>
                  <View style={styles.journeyText}>
                    <Text
                      style={[
                        styles.journeyRank,
                        current ? { color: palette.electric } : reached ? null : styles.journeyDim,
                      ]}
                    >
                      {milestone.rank}
                    </Text>
                    <Text style={[styles.journeyLevel, reached ? null : styles.journeyDim]}>
                      Level {milestone.level} &middot; {milestone.xpRequired.toLocaleString()} xp
                    </Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>

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
  scroll: {
    width: '100%',
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: space.lg,
  },
  centerGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
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
  rankText: {
    ...type.title,
    color: palette.gold,
    marginBottom: space.lg,
  },
  card: {
    width: '100%',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.strong,
    backgroundColor: semantic.bg.surface,
    padding: space.lg,
    gap: space.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  cardBrand: {
    ...type.data,
    color: semantic.text.secondary,
  },
  cardXpLabel: {
    ...type.data,
    color: semantic.text.tertiary,
    marginTop: space.sm,
  },
  cardXpValue: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 20,
    letterSpacing: 1.5,
    color: semantic.text.primary,
  },
  cardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: semantic.border.subtle,
  },
  cardStat: {
    alignItems: 'flex-start',
    gap: 2,
  },
  cardStatLabel: {
    ...type.data,
    fontSize: 10,
    color: semantic.text.tertiary,
  },
  cardStatValue: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.lg,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
  },
  shareLabel: {
    ...type.caption,
    color: semantic.text.secondary,
  },
  journey: {
    width: '100%',
    marginTop: space.xl,
    gap: space.sm,
  },
  journeyHeading: {
    ...type.title,
    color: semantic.text.primary,
    marginBottom: space.xs,
  },
  journeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    padding: space.md,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    backgroundColor: semantic.bg.surface,
  },
  journeyBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: semantic.bg.canvas,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  journeyBadgeReached: {
    backgroundColor: withAlpha(palette.electric, 0.14),
    borderColor: withAlpha(palette.electric, 0.3),
  },
  journeyBadgeCurrent: {
    backgroundColor: withAlpha(palette.electric, 0.2),
    borderColor: palette.electric,
  },
  journeyText: {
    gap: 2,
  },
  journeyRank: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  journeyLevel: {
    ...type.caption,
    color: semantic.text.secondary,
  },
  journeyDim: {
    color: semantic.text.tertiary,
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
