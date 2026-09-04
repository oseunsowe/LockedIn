import { useMutation, useQueryClient } from '@tanstack/react-query';

import { activeMissionsQueryKey } from './useActiveMissions';
import { hoursFromNow } from '@/lib/time';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type MissionInsert = Database['public']['Tables']['missions']['Insert'];

/**
 * Testing utility, not a product feature — inserts a handful of realistic missions for the
 * signed-in user via a real client insert (RLS `missions_all_own`, same policy the app's own
 * mission-creation flow uses), so the dashboard/board/active-mission/proof/verification/progress/
 * insights screens all have real Supabase-backed data to exercise instead of their empty states.
 * Remove this (and its entry point on the Profile screen) before shipping — a "seed demo data"
 * button has no place in a production build.
 *
 * Idempotent by title: re-running it (e.g. after this file gains more seed rows in a later
 * session) fetches the user's existing mission titles first and only inserts the ones missing,
 * rather than blindly duplicating everything on every tap.
 *
 * Includes a few already-`completed`/`recovery` missions (with backdated `created_at`/
 * `completed_at`) purely so Progress Profile's Mission History and Completion Rate, and the
 * Insights screen's completion-rate card, have something to show — normally only the verify-proof
 * Edge Function makes that status transition, but there's no AI judgment involved in seeding fake
 * history, so a direct insert is fine here.
 *
 * What this deliberately does NOT do, and never will: write to `xp_events`, bump
 * `profiles.xp_total`/`level`, or touch `streak_count`. RLS blocks client inserts into `xp_events`
 * entirely (server/service_role only, by design, so a compromised client can't self-award XP —
 * see TODO.md §8.1), and `streak_count` is only ever advanced by the server-side
 * `record_mission_completion_streak()` function. This tool has no reason to route around either
 * even for testing. That means Progress Profile's **Consistency** and **Growth Trend** stats, and
 * Insights' streak/consistency/growth cards, stay at 0%/no-data/absent after seeding — only a real
 * verified mission, through the actual proof → verify-proof flow, produces those. No amount of
 * seed-script cleverness can honestly change that; deploying `verify-proof` and submitting one
 * real proof is the only path to seeing them populated.
 */
export function useSeedDemoData(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('You must be signed in to seed demo data.');

      const rows: MissionInsert[] = [
        {
          user_id: userId,
          type: 'main',
          title: 'Ship the landing page',
          difficulty: 'hard',
          status: 'active',
          xp_reward: 500,
          proof_requirements: [{ type: 'screenshot' }],
          deadline: hoursFromNow(48),
        },
        {
          user_id: userId,
          type: 'side',
          title: 'Read for 30 minutes',
          difficulty: 'standard',
          status: 'active',
          xp_reward: 100,
          proof_requirements: [{ type: 'photo' }],
          deadline: hoursFromNow(24),
        },
        {
          user_id: userId,
          type: 'side',
          title: 'Refactor the auth module',
          difficulty: 'challenging',
          status: 'active',
          xp_reward: 250,
          proof_requirements: [{ type: 'screenshot' }],
          deadline: hoursFromNow(72),
        },
        {
          user_id: userId,
          type: 'daily',
          title: 'Morning workout',
          difficulty: 'standard',
          status: 'active',
          xp_reward: 100,
          proof_requirements: [{ type: 'photo' }],
          deadline: hoursFromNow(12),
        },
        {
          user_id: userId,
          type: 'daily',
          title: 'No social media before noon',
          difficulty: 'epic',
          status: 'active',
          xp_reward: 1000,
          proof_requirements: [],
          deadline: hoursFromNow(-2), // already overdue — exercises Active Mission Mode's Recovery Mode prompt
        },
        // Backdated history — see this file's doc comment on why these are inserted already
        // completed/in-recovery, not run through the real active → proof → verify flow.
        {
          user_id: userId,
          type: 'side',
          title: 'Write the onboarding docs',
          difficulty: 'standard',
          status: 'completed',
          xp_reward: 100,
          proof_requirements: [{ type: 'file' }],
          deadline: hoursFromNow(-96),
          created_at: hoursFromNow(-120),
          completed_at: hoursFromNow(-72),
        },
        {
          user_id: userId,
          type: 'main',
          title: 'Deploy the staging environment',
          difficulty: 'hard',
          status: 'completed',
          xp_reward: 400,
          proof_requirements: [{ type: 'screenshot' }],
          deadline: hoursFromNow(-216),
          created_at: hoursFromNow(-240),
          completed_at: hoursFromNow(-192),
        },
        {
          user_id: userId,
          type: 'daily',
          title: 'Weekly meal prep',
          difficulty: 'standard',
          status: 'recovery',
          xp_reward: 100,
          proof_requirements: [{ type: 'photo' }],
          deadline: hoursFromNow(-120),
          created_at: hoursFromNow(-144),
        },
        {
          user_id: userId,
          type: 'side',
          title: 'Update the design system docs',
          difficulty: 'standard',
          status: 'completed',
          xp_reward: 150,
          proof_requirements: [{ type: 'screenshot' }],
          deadline: hoursFromNow(-48),
          created_at: hoursFromNow(-72),
          completed_at: hoursFromNow(-36),
        },
      ];

      const { data: existing, error: existingError } = await supabase
        .from('missions')
        .select('title')
        .eq('user_id', userId);
      if (existingError) throw existingError;

      const existingTitles = new Set(existing.map((mission) => mission.title));
      const newRows = rows.filter((row) => !existingTitles.has(row.title));

      if (newRows.length === 0) return { inserted: 0 };

      const { error } = await supabase.from('missions').insert(newRows);
      if (error) throw error;
      return { inserted: newRows.length };
    },
    onSuccess: () => {
      if (userId) void queryClient.invalidateQueries({ queryKey: activeMissionsQueryKey(userId) });
    },
  });
}
