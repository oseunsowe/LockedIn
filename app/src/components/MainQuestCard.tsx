import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useCountdown } from '@/hooks/useCountdown';
import { difficultyMeta, parseProofRequirements, type Mission } from '@/lib/missions';
import { glow, gradients, Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

type MainQuestCardProps = {
  mission: Mission;
  onPress: () => void;
};

/**
 * The dashboard's one dominant mission (TODO.md §6: "the first screen after login shows one
 * dominant mission, never a list"). "Start Mission" routes to the mission board rather than
 * straight into Active Mission Mode — that screen is Phase 7.3, not yet built.
 */
export function MainQuestCard({ mission, onPress }: MainQuestCardProps) {
  const proofChips = parseProofRequirements(mission.proof_requirements);
  const countdown = useCountdown(mission.deadline);
  const difficulty = difficultyMeta[mission.difficulty];

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, glow(palette.electric, { opacity: 0.3 })]}
      accessibilityRole="button"
      accessibilityLabel={`Main quest: ${mission.title}`}
    >
      <LinearGradient
        colors={[withAlpha(gradients.xp[0], 0.16), withAlpha(gradients.xp[1], 0.05)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.kickerRow}>
        <Icon name="mainQuest" size={16} color={palette.gold} />
        <Text style={styles.kicker}>MAIN QUEST</Text>
        <View style={styles.statusChip}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {mission.title}
      </Text>
      <Text style={[styles.difficulty, { color: difficulty.color }]}>{difficulty.label}</Text>
      <View style={styles.clockRow}>
        {countdown ? (
          <View>
            <Text
              style={[styles.clock, countdown.overdue ? { color: semantic.state.warning } : null]}
              accessibilityLabel={countdown.overdue ? 'Overdue' : `${countdown.label} remaining`}
            >
              {countdown.overdue ? 'OVERDUE' : countdown.label}
            </Text>
            <Text style={styles.clockLabel}>
              {countdown.overdue ? 'RECOVERY AVAILABLE' : 'REMAINING'}
            </Text>
          </View>
        ) : (
          <View>
            <Text style={styles.clock}>OPEN</Text>
            <Text style={styles.clockLabel}>NO DEADLINE</Text>
          </View>
        )}
        <View style={styles.xpBadge}>
          <Icon name="xp" size={14} color={palette.gold} />
          <Text style={styles.xpText}>+{mission.xp_reward} XP</Text>
        </View>
      </View>
      {proofChips.length > 0 ? (
        <View style={styles.proofRow}>
          {proofChips.map((chip) => (
            <View key={chip.type} style={styles.proofChip}>
              <Icon name={chip.icon} size={12} color={semantic.text.tertiary} />
              <Text style={styles.proofLabel}>{chip.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <View style={styles.cta}>
        <Text style={styles.ctaLabel}>CONTINUE MISSION</Text>
        <Icon name="play" size={14} color={semantic.text.onAccent} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: withAlpha(palette.electric, 0.3),
    backgroundColor: semantic.bg.surface,
    padding: space.lg,
    overflow: 'hidden',
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
    ...type.title,
    color: semantic.text.primary,
  },
  statusChip: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.electric, 0.16),
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: palette.electric,
  },
  statusText: {
    ...type.data,
    fontSize: 10,
    color: palette.iris,
  },
  difficulty: {
    ...type.caption,
    marginTop: -space.sm,
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  clock: {
    ...type.display,
    fontSize: 34,
    lineHeight: 38,
    color: semantic.text.primary,
  },
  clockLabel: {
    ...type.data,
    fontSize: 10,
    color: semantic.text.tertiary,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.gold, 0.14),
  },
  xpText: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.gold,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  ctaLabel: {
    ...type.bodyMedium,
    fontSize: 14,
    letterSpacing: 0.6,
    color: semantic.text.onAccent,
  },
  metaRow: {
    flexDirection: 'row',
    gap: space.md,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  metaText: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.secondary,
  },
  proofRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  proofChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: semantic.glass.fill8,
  },
  proofLabel: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
  },
});
