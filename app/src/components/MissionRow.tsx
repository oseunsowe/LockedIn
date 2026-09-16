import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatTimeRemaining } from '@/lib/time';
import type { Mission } from '@/lib/missions';
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
  return (
    <Pressable
      style={styles.row}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open mission: ${mission.title}`}
    >
      <View style={styles.iconWrap}>
        <Icon name={typeIcon[mission.type]} size={18} color={semantic.text.secondary} />
      </View>
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
    width: 36,
    height: 36,
    borderRadius: radius.icon,
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
