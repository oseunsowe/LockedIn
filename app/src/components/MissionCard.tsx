import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DifficultyMeter } from './DifficultyMeter';
import { LockDial } from './LockDial';
import {
  computeElapsedProgress,
  formatCountdownCompact,
  formatTimeRemaining,
  isUrgent,
} from '@/lib/time';
import { difficultyMeta, parseProofRequirements, type Mission } from '@/lib/missions';
import {
  fontFamily,
  glow,
  gradients,
  Icon,
  type IconName,
  palette,
  radius,
  semantic,
  space,
  type,
  withAlpha,
} from '@/theme';

const typeMeta: Record<Mission['type'], { icon: IconName; label: string }> = {
  main: { icon: 'mainQuest', label: 'MAIN QUEST' },
  side: { icon: 'side', label: 'SIDE MISSION' },
  daily: { icon: 'daily', label: 'DAILY CHALLENGE' },
};

type MissionCardProps = {
  mission: Mission;
  onPress: () => void;
  /** The Mission Board's one dominant mission (TODO.md §6) gets more visual weight — a gradient
   * wash, a glow, and a larger dial — never a second list-style card competing for attention. */
  hero?: boolean;
};

/**
 * The Mission Board's card (TODO.md §7.1) — title, difficulty, time remaining, XP, proof
 * requirement, status. No `progress` field: the schema has no partial-progress column (a mission
 * is `active` until it's `completed`/`failed`/`recovery` — see supabase/migrations), so a progress
 * bar here would have to fabricate a number. Status always reads ACTIVE because this board only
 * ever queries active missions (`useActiveMissions`) — still real, not a placeholder.
 *
 * Tapping opens Active Mission Mode (§7.3, `app/(modals)/active-mission.tsx`) for this mission.
 */
export function MissionCard({ mission, onPress, hero = false }: MissionCardProps) {
  const meta = typeMeta[mission.type];
  const difficulty = difficultyMeta[mission.difficulty];
  const proofChips = parseProofRequirements(mission.proof_requirements);
  const elapsed = computeElapsedProgress(mission.created_at, mission.deadline);
  const countdown = formatCountdownCompact(mission.deadline);
  const urgent = isUrgent(mission.deadline);

  return (
    <Pressable
      style={[
        styles.card,
        hero ? [styles.cardHero, glow(palette.electric, { opacity: 0.28 })] : null,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open mission: ${mission.title}, ${formatTimeRemaining(mission.deadline)}`}
    >
      {hero ? (
        <LinearGradient
          colors={[withAlpha(gradients.xp[0], 0.16), withAlpha(gradients.xp[1], 0.05)]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.topRow}>
        <View style={styles.kickerRow}>
          <Icon name={meta.icon} size={14} color={semantic.text.tertiary} />
          <Text style={styles.kicker}>{meta.label}</Text>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>ACTIVE</Text>
        </View>
      </View>

      <Text style={[styles.title, hero ? styles.titleHero : null]} numberOfLines={2}>
        {mission.title}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.difficultyGroup}>
          <DifficultyMeter difficulty={mission.difficulty} />
          <Text style={[styles.difficultyLabel, { color: difficulty.color }]}>
            {difficulty.label}
          </Text>
        </View>
        <LockDial
          size={hero ? 56 : 40}
          progress={elapsed === null ? 1 : 1 - elapsed / 100}
          colors={[difficulty.color, difficulty.color]}
          urgent={urgent}
          gradientId={`mission-card-${mission.id}`}
        >
          <Text style={[styles.dialValue, hero ? styles.dialValueHero : null]}>
            {countdown.value}
            {countdown.unit.length === 1 ? countdown.unit : ''}
          </Text>
        </LockDial>
      </View>

      <View style={styles.bottomRow}>
        {proofChips.length > 0 ? (
          <View style={styles.proofRow}>
            {proofChips.map((chip) => (
              <Icon key={chip.type} name={chip.icon} size={14} color={semantic.text.tertiary} />
            ))}
          </View>
        ) : (
          <View />
        )}
        <View style={styles.xpChip}>
          <Icon name="xp" size={12} color={palette.gold} />
          <Text style={styles.xpText}>+{mission.xp_reward} XP</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    backgroundColor: semantic.bg.surface,
    padding: space.md,
    gap: space.sm,
    overflow: 'hidden',
  },
  cardHero: {
    borderColor: withAlpha(palette.electric, 0.3),
    padding: space.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  kicker: {
    ...type.data,
    color: semantic.text.tertiary,
  },
  statusChip: {
    paddingVertical: 2,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.electric, 0.15),
  },
  statusText: {
    ...type.data,
    fontSize: 10,
    color: palette.electric,
  },
  title: {
    ...type.bodyMedium,
    fontSize: 17,
    color: semantic.text.primary,
  },
  titleHero: {
    ...type.title,
    color: semantic.text.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  difficultyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  difficultyLabel: {
    ...type.caption,
    fontSize: 12,
  },
  dialValue: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 11,
    color: semantic.text.primary,
  },
  dialValueHero: {
    fontSize: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proofRow: {
    flexDirection: 'row',
    gap: space.sm,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  xpText: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.gold,
  },
});
