import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useMissionsForDay } from '@/hooks/useMissionsForDay';
import type { Mission } from '@/lib/missions';
import { formatTimeRange } from '@/lib/time';
import { useAuth } from '@/state/auth';
import { campaigns, Icon, palette, radius, semantic, space, type, withAlpha } from '@/theme';

const HOUR_START = 6; // 6 AM
const HOUR_END = 23; // 11 PM (exclusive top of the last row)
const HOUR_HEIGHT = 64;

function addDays(day: Date, delta: number): Date {
  const copy = new Date(day);
  copy.setDate(copy.getDate() + delta);
  return copy;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayLabel(day: Date): string {
  const today = new Date();
  if (isSameDay(day, today)) return 'Today';
  if (isSameDay(day, addDays(today, 1))) return 'Tomorrow';
  if (isSameDay(day, addDays(today, -1))) return 'Yesterday';
  return day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/** A block's vertical position/height within the 6 AM–11 PM grid, clamped to the visible range. */
function blockLayout(mission: Mission): { top: number; height: number } | null {
  if (!mission.start_time || !mission.end_time) return null;
  const start = new Date(mission.start_time);
  const end = new Date(mission.end_time);
  const startHour = start.getHours() + start.getMinutes() / 60;
  const endHour = end.getHours() + end.getMinutes() / 60;
  const top = Math.max(0, (startHour - HOUR_START) * HOUR_HEIGHT);
  const height = Math.max(28, (endHour - startHour) * HOUR_HEIGHT);
  return { top, height };
}

/**
 * Day Timeline (Time-Blocking addition to TODO.md's Phase 17) — the scheduled-time counterpart to
 * the Mission Board's type-grouped list. Only missions with a `start_time`/`end_time` block show
 * here; everything else stays exactly where Mission Board already puts it. A completed/failed
 * mission's block still renders (grayed out), rather than disappearing, so the day's real history
 * is visible, not just what's still active.
 */
export default function DayTimelineModal() {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const dayQuery = useMissionsForDay(session?.user.id, selectedDay);
  const missions = dayQuery.data ?? [];

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = HOUR_START; h < HOUR_END; h++) list.push(h);
    return list;
  }, []);

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.closeButton, { top: insets.top + space.sm }]}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <Icon name="close" size={18} color={semantic.text.secondary} />
      </Pressable>

      <View style={[styles.headerBlock, { paddingTop: insets.top + space.xxl }]}>
        <Text style={styles.title}>Day Timeline</Text>
        <View style={styles.daySwitcher}>
          <Pressable
            onPress={() => setSelectedDay((d) => addDays(d, -1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous day"
          >
            <Text style={styles.daySwitcherArrow}>‹</Text>
          </Pressable>
          <Text style={styles.daySwitcherLabel}>{formatDayLabel(selectedDay)}</Text>
          <Pressable
            onPress={() => setSelectedDay((d) => addDays(d, 1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next day"
          >
            <Text style={styles.daySwitcherArrow}>›</Text>
          </Pressable>
        </View>
      </View>

      {dayQuery.isPending ? (
        <ActivityIndicator color={palette.electric} style={styles.loading} />
      ) : dayQuery.isError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>Couldn&rsquo;t load this day.</Text>
          <Pressable
            onPress={() => void dayQuery.refetch()}
            style={styles.retryButton}
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text style={styles.retryLabel}>Try again</Text>
          </Pressable>
        </View>
      ) : missions.length === 0 ? (
        <View style={styles.emptyState}>
          <Icon name="timeline" size={32} color={semantic.text.tertiary} />
          <Text style={styles.emptyTitle}>Nothing scheduled.</Text>
          <Text style={styles.emptySubtitle}>
            Add a time block from a mission&rsquo;s creation screen to see it here.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + space.xxxl }}>
          <View style={styles.grid}>
            {hours.map((hour) => (
              <View key={hour} style={[styles.hourRow, { height: HOUR_HEIGHT }]}>
                <Text style={styles.hourLabel}>
                  {new Date(0, 0, 0, hour).toLocaleTimeString(undefined, { hour: 'numeric' })}
                </Text>
                <View style={styles.hourLine} />
              </View>
            ))}

            {missions.map((mission) => {
              const layout = blockLayout(mission);
              if (!layout) return null;
              const accent = mission.campaign_key
                ? campaigns[mission.campaign_key].accent
                : palette.electric;
              const dimmed = mission.status !== 'active';
              return (
                <Pressable
                  key={mission.id}
                  style={[
                    styles.block,
                    {
                      top: layout.top,
                      height: layout.height,
                      left: 64,
                      right: space.lg,
                      borderColor: accent,
                      backgroundColor: withAlpha(accent, dimmed ? 0.06 : 0.14),
                      opacity: dimmed ? 0.6 : 1,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: '/(modals)/active-mission',
                      params: { id: mission.id },
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel={mission.title}
                >
                  <Text style={styles.blockTitle} numberOfLines={1}>
                    {mission.title}
                  </Text>
                  {mission.start_time && mission.end_time ? (
                    <Text style={styles.blockTime}>
                      {formatTimeRange(mission.start_time, mission.end_time)}
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semantic.bg.canvas,
  },
  closeButton: {
    position: 'absolute',
    right: space.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: semantic.bg.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBlock: {
    paddingHorizontal: space.xl,
    gap: space.md,
    marginBottom: space.lg,
  },
  title: {
    ...type.display,
    color: semantic.text.primary,
  },
  daySwitcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  daySwitcherArrow: {
    ...type.title,
    color: semantic.text.secondary,
    paddingHorizontal: space.sm,
  },
  daySwitcherLabel: {
    ...type.bodyMedium,
    color: semantic.text.primary,
    minWidth: 140,
    textAlign: 'center',
  },
  loading: {
    marginTop: space.xxl,
  },
  errorCard: {
    alignItems: 'center',
    gap: space.md,
    marginHorizontal: space.xl,
    padding: space.xl,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
  },
  errorText: {
    ...type.body,
    color: semantic.text.secondary,
  },
  retryButton: {
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    backgroundColor: semantic.action.primary,
  },
  retryLabel: {
    ...type.bodyMedium,
    color: semantic.text.onAccent,
  },
  emptyState: {
    alignItems: 'center',
    gap: space.sm,
    marginHorizontal: space.xl,
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
    borderRadius: radius.card,
    backgroundColor: semantic.bg.surface,
    borderWidth: 1,
    borderColor: semantic.border.subtle,
  },
  emptyTitle: {
    ...type.bodyMedium,
    color: semantic.text.secondary,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...type.caption,
    color: semantic.text.tertiary,
    textAlign: 'center',
  },
  grid: {
    position: 'relative',
    paddingHorizontal: space.xl,
  },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  hourLabel: {
    ...type.caption,
    color: semantic.text.tertiary,
    width: 48,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: semantic.border.subtle,
    marginTop: 6,
  },
  block: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: radius.tile,
    padding: space.sm,
    justifyContent: 'center',
    gap: 2,
  },
  blockTitle: {
    ...type.bodyMedium,
    fontSize: 14,
    color: semantic.text.primary,
  },
  blockTime: {
    ...type.caption,
    fontSize: 11,
    color: semantic.text.tertiary,
  },
});
