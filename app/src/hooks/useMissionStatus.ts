import { useMutation, useQueryClient } from '@tanstack/react-query';

import { activeMissionsQueryKey } from './useActiveMissions';
import { recoveryMissionsQueryKey } from './useRecoveryMissions';
import { supabase } from '@/lib/supabase';
import type { MissionStatus } from '@/lib/database.types';

/**
 * Moves a mission between `active` and `recovery` (TODO.md §9's "no shame" rule — an overdue
 * mission goes straight to `recovery`, never surfaced to the user as `failed`, and always has a
 * path back to `active`). A real client update under the existing `missions_all_own` RLS policy,
 * not a server-only operation — there's no AI judgment involved, just the user acknowledging a
 * deadline passed or deciding to pick it back up.
 *
 * `fromStatus` is a required optimistic-concurrency guard, not decoration: without it, a stale
 * Active Mission Mode screen (still showing "overdue" because its cached mission query was never
 * invalidated by a verify-proof call that landed in the background) can clobber a mission that the
 * server already flipped to `completed` moments earlier back to `recovery` — a real bug this
 * caught, where `completed_at` stayed set but `status` reverted, silently zeroing the Progress
 * Profile's completion rate. Scoping the update to the expected current status makes the write a
 * safe no-op (0 rows affected) instead of a race.
 */
export function useSetMissionStatus(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      missionId: string;
      status: MissionStatus;
      fromStatus: MissionStatus;
      deadline?: string | null;
    }) => {
      const update: { status: MissionStatus; deadline?: string | null } = { status: input.status };
      if (input.deadline !== undefined) update.deadline = input.deadline;
      const { error } = await supabase
        .from('missions')
        .update(update)
        .eq('id', input.missionId)
        .eq('status', input.fromStatus);
      if (error) throw error;
    },
    onSuccess: () => {
      if (userId) {
        void queryClient.invalidateQueries({ queryKey: activeMissionsQueryKey(userId) });
        void queryClient.invalidateQueries({ queryKey: recoveryMissionsQueryKey(userId) });
      }
    },
  });
}
