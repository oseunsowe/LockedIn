import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';
import type { Mission } from '@/lib/missions';

/** `day`'s local-calendar-day boundaries as UTC ISO strings, for a `start_time` range query. */
function dayBoundsIso(day: Date): { startIso: string; endIso: string } {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

/** `dayKey` is the local calendar date ('YYYY-MM-DD'), not the ISO bounds — a stable, readable
 * cache key that doesn't change on every render the way a fresh `toISOString()` call would. */
function dayKey(day: Date): string {
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
}

export function missionsForDayQueryKey(userId: string, day: Date) {
  return ['missions', userId, 'day', dayKey(day)] as const;
}

/**
 * A user's scheduled time-block missions for one calendar day (TODO.md's Time-Blocking addition
 * to Phase 17), for the Day Timeline view. Any status is included, not just `active` — a
 * completed/failed mission's block should still show on its day (grayed out by the screen), not
 * silently disappear, unlike `useActiveMissions` which is deliberately status-scoped.
 */
export function useMissionsForDay(userId: string | undefined, day: Date) {
  return useQuery<Mission[]>({
    queryKey: userId ? missionsForDayQueryKey(userId, day) : ['missions', 'anonymous', 'day'],
    queryFn: async () => {
      const { startIso, endIso } = dayBoundsIso(day);
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('user_id', userId as string)
        .gte('start_time', startIso)
        .lt('start_time', endIso)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
