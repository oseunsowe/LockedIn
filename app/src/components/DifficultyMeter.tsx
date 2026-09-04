import { StyleSheet, View } from 'react-native';

import { difficultyMeta } from '@/lib/missions';
import type { MissionDifficulty } from '@/lib/database.types';
import { semantic } from '@/theme';

const BAR_HEIGHTS = [6, 10, 14, 18];

type DifficultyMeterProps = {
  difficulty: MissionDifficulty;
};

/**
 * Signal-strength-style meter — 4 ascending bars, filled up to the difficulty's `weight`
 * (`lib/missions.ts`). Carries the difficulty visually (bar count + color) as well as by label,
 * per TODO.md §7.1 ("with visual weight, not just a label") and §14.2 ("never encode meaning in
 * color alone").
 */
export function DifficultyMeter({ difficulty }: DifficultyMeterProps) {
  const meta = difficultyMeta[difficulty];
  return (
    <View style={styles.row} accessibilityLabel={`${meta.label} difficulty`}>
      {BAR_HEIGHTS.map((height, i) => (
        <View
          key={height}
          style={[
            styles.bar,
            { height, backgroundColor: i < meta.weight ? meta.color : semantic.border.subtle },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
