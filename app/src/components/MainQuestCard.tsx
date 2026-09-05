import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimeRemaining } from '@/lib/time';
import { parseProofRequirements, type Mission } from '@/lib/missions';
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
        <View style={styles.metaChip}>
          <Icon name="timer" size={14} color={semantic.text.secondary} />
          <Text style={styles.metaText}>{formatTimeRemaining(mission.deadline)}</Text>
        </View>
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
