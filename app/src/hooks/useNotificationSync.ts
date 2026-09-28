import { useEffect } from 'react';

import { useActiveMissions } from '@/hooks/useActiveMissions';
import { useDemoMode } from '@/lib/demoMode';
import { planNotifications } from '@/lib/notificationPlan';
import { useNotificationPrefs } from '@/lib/notificationPrefsStore';
import { applyNotificationPlan, getNotificationPermission } from '@/lib/notifications';
import { useAuth } from '@/state/auth';

/**
 * Keeps the OS notification queue in sync with the user's missions, streak and preferences.
 * Mounted once in the tab layout. Does nothing until the user has granted permission (which is only
 * ever requested from the Profile screen's Notifications section, never at launch), and stays out
 * of the way in Demo Mode so fake data never produces real reminders.
 */
export function useNotificationSync() {
  const { session, profile } = useAuth();
  const prefs = useNotificationPrefs();
  const demo = useDemoMode();
  const missionsQuery = useActiveMissions(session?.user.id);
  const missions = missionsQuery.data;
  const streakCount = profile?.streak_count ?? 0;
  const lastStreakDate = profile?.last_streak_date ?? null;

  useEffect(() => {
    if (!session || demo.enabled || !missions) return;
    let cancelled = false;
    void (async () => {
      if (!(await getNotificationPermission()) || cancelled) return;
      await applyNotificationPlan(
        planNotifications({
          prefs,
          missions: missions.map((m) => ({ id: m.id, title: m.title, deadline: m.deadline })),
          streakCount,
          lastStreakDate,
          now: new Date(),
        }),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [session, demo.enabled, missions, prefs, streakCount, lastStreakDate]);
}
