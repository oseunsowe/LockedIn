import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LockDial } from './LockDial';
import { computeElapsedProgress, formatTimeRemaining, isUrgent } from '@/lib/time';
import { difficultyMeta, type Mission } from '@/lib/missions';
import { Icon, type IconName, palette, radius, semantic, space, type } from '@/theme';

const typeIcon: Record<Mission['type'], IconName> = {
  main: 'mainQuest',
  side: 'side',
  daily: 'daily',
};

type MissionRowProps = {
  mission: Mission;
  onPress: () => void;
};

/** A compact, clearly-subordinate row for non-hero missions (TODO.md §6). */
export function MissionRow({ mission, onPress }: MissionRowProps) {
  const elapsed = computeElapsedProgress(mission.created_at, mission.deadline);
  const tierColor = difficultyMeta[mission.difficulty].color;

  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open mission: ${mission.title}, ${formatTimeRemaining(mission.deadline)}`}
    >
      <LockDial
        size={36}
        strokeWidth={2}
        progress={elapsed === null ? 1 : 1 - elapsed / 100}
        colors={[tierColor, tierColor]}
        urgent={isUrgent(mission.deadline)}
        ticks={false}
        gradientId={`mission-row-${mission.id}`}
      >
        <View style={styles.iconWrap}>
          <Icon name={typeIcon[mission.type]} size={16} color={semantic.text.secondary} />
        </View>
      </LockDial>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {mission.title}
        </Text>
        <Text style={styles.meta}>{formatTimeRemaining(mission.deadline)}</Text>
      </View>
      <Text style={styles.xp}>+{mission.xp_reward} XP</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: semantic.bg.surface,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
    padding: space.md,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: semantic.glass.fill8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...type.bodyMedium,
    color: semantic.text.primary,
  },
  meta: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  xp: {
    ...type.data,
    textTransform: 'none',
    letterSpacing: 0,
    color: palette.violet,
  },
});
