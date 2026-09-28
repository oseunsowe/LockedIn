import { StyleSheet, Text, View } from 'react-native';

import { features, type ReliabilityScore } from '@/lib/features';
import { formatFocusDuration } from '@/lib/focusStats';
import { Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

type DailyCommandCardProps = {
  doneToday: number;
  totalToday: number;
  weekCompleted: number;
  streak: number;
  /** Seconds of Focus Mode today, or `null` while unknown. */
  focusSeconds: number | null;
  /** Only rendered when the `reliabilityScore` feature flag is on AND data exists. */
  reliability?: ReliabilityScore | null;
};

/**
 * The Home "Daily Command" module (UI v2): today's mission completion, the week's verified count,
 * streak and focus time in one dense card, replacing the oversized performance ring. Every number
 * comes from real data; Reliability is architecture-only behind `features.reliabilityScore`.
 */
export function DailyCommandCard({
  doneToday,
  totalToday,
  weekCompleted,
  streak,
  focusSeconds,
  reliability,
}: DailyCommandCardProps) {
  const complete = totalToday > 0 && doneToday >= totalToday;
  const fill = totalToday > 0 ? Math.min(doneToday / totalToday, 1) : 0;
  const showReliability = features.reliabilityScore && !!reliability;
  const accent = complete ? palette.gold : palette.electric;

  const summary =
    totalToday === 0
      ? 'No missions due today.'
      : `${doneToday} of ${totalToday} missions verified today${complete ? ', all done' : ''}.`;

  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`${summary} ${weekCompleted} verified in the last 7 days.${
        streak > 0 ? ` ${streak} day streak.` : ''
      }`}
    >
      <View style={styles.topRow}>
        <View style={styles.today}>
          <Text style={styles.label}>TODAY</Text>
          {totalToday > 0 ? (
            <View style={styles.bigRow}>
              <Text style={[styles.big, complete ? { color: palette.gold } : null]}>
                {doneToday}
              </Text>
              <Text style={styles.bigOf}>/ {totalToday}</Text>
            </View>
          ) : (
            <Text style={styles.empty}>Nothing due</Text>
          )}
          <Text style={styles.label}>{complete ? 'ALL VERIFIED' : 'MISSIONS'}</Text>
        </View>

        <View style={styles.side}>
          {showReliability && reliability ? (
            <View style={styles.stat}>
              <Text style={styles.label}>RELIABILITY</Text>
              <Text style={styles.statValue}>
                {reliability.score}
                {reliability.delta ? (
                  <Text style={styles.delta}>
                    {' '}
                    {reliability.delta > 0 ? '↑' : '↓'}
                    {Math.abs(reliability.delta)}
                  </Text>
                ) : null}
              </Text>
            </View>
          ) : null}
          <View style={styles.stat}>
            <Text style={styles.label}>7 DAY</Text>
            <Text style={styles.statValue}>
              {weekCompleted}
              <Text style={styles.statUnit}> verified</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.track} accessibilityElementsHidden importantForAccessibility="no">
        <View
          style={[styles.fill, { width: `${Math.round(fill * 100)}%`, backgroundColor: accent }]}
        />
      </View>

      <View style={styles.footer}>
        {streak > 0 ? (
          <View style={styles.chip}>
            <Icon name="streak" size={13} color={palette.gold} />
            <Text style={styles.chipText}>{streak} day streak</Text>
          </View>
        ) : null}
        {focusSeconds !== null && focusSeconds > 0 ? (
          <View style={styles.chip}>
            <Icon name="timer" size={13} color={semantic.text.secondary} />
            <Text style={styles.chipText}>{formatFocusDuration(focusSeconds)} focus</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: space.lg,
  },
  today: {
    gap: 2,
  },
  label: {
    ...type.data,
    fontSize: 11,
    color: semantic.text.tertiary,
  },
  bigRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
  },
  big: {
    ...type.display,
    fontSize: 48,
    lineHeight: 52,
    color: semantic.text.primary,
  },
  bigOf: {
    ...type.title,
    color: semantic.text.tertiary,
  },
  empty: {
    ...type.title,
    color: semantic.text.secondary,
    paddingVertical: space.sm,
  },
  side: {
    alignItems: 'flex-end',
    gap: space.md,
  },
  stat: {
    alignItems: 'flex-end',
    gap: 2,
  },
  statValue: {
    ...type.title,
    color: semantic.text.primary,
  },
  statUnit: {
    ...type.caption,
    color: semantic.text.tertiary,
  },
  delta: {
    ...type.caption,
    color: semantic.state.success,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: semantic.glass.fill8,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: space.sm,
    borderRadius: radius.pill,
    backgroundColor: withAlpha(palette.electric, 0.1),
  },
  chipText: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.secondary,
  },
});
