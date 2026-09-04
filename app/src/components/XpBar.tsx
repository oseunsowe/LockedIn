import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { levelProgress } from '@/lib/leveling';
import { gradients, semantic, space, type } from '@/theme';

type XpBarProps = {
  totalXp: number;
};

/**
 * The dashboard header's XP-to-next-level bar — unblocked by the real curve in
 * `src/lib/leveling.ts` (TODO.md §9). Deliberately not built until that curve existed; showing a
 * fill percentage against thresholds nobody had designed yet would have been a fabricated number.
 */
export function XpBar({ totalXp }: XpBarProps) {
  const progress = levelProgress(totalXp);
  const isMaxLevel = progress.xpForNextLevel === 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <LinearGradient
          colors={gradients.xp}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${Math.round(progress.progress * 100)}%` }]}
        />
      </View>
      <Text style={styles.label}>
        {isMaxLevel
          ? 'MAX LEVEL'
          : `${progress.xpIntoLevel.toLocaleString()} / ${progress.xpForNextLevel.toLocaleString()} XP`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: space.xs / 2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: semantic.border.subtle,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
  label: {
    ...type.data,
    fontSize: 10,
    textTransform: 'none',
    letterSpacing: 0,
    color: semantic.text.tertiary,
  },
});
