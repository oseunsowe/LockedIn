import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LockDial } from './LockDial';
import { computeElapsedProgress, formatCountdownCompact, isUrgent } from '@/lib/time';
import { difficultyMeta, parseProofRequirements, type Mission } from '@/lib/missions';
import {
  fontFamily,
  glow,
  gradients,
  Icon,
  palette,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

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
  const difficulty = difficultyMeta[mission.difficulty];
  const elapsed = computeElapsedProgress(mission.created_at, mission.deadline);
  const countdown = formatCountdownCompact(mission.deadline);
  const urgent = isUrgent(mission.deadline);

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
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {mission.title}
      </Text>
      <View style={styles.metaRow}>
        <LockDial
          size={56}
          progress={elapsed === null ? 1 : 1 - elapsed / 100}
          colors={[difficulty.color, difficulty.color]}
          urgent={urgent}
          gradientId={`main-quest-${mission.id}`}
        >
          <Text style={styles.dialValue}>
            {countdown.value}
            {countdown.unit.length === 1 ? countdown.unit : ''}
          </Text>
          <Text style={styles.dialUnit}>{countdown.unit.length === 1 ? 'left' : ''}</Text>
        </LockDial>
        <View style={styles.metaChip}>
          <Icon name="xp" size={14} color={palette.gold} />
          <Text style={[styles.metaText, { color: palette.gold }]}>+{mission.xp_reward} XP</Text>
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  dialValue: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 14,
    color: semantic.text.primary,
    lineHeight: 16,
  },
  dialUnit: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: semantic.text.tertiary,
    marginTop: 2,
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
