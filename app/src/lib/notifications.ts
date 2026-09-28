import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { PlannedNotification } from '@/lib/notificationPlan';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function getNotificationPermission(): Promise<boolean> {
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    return granted;
  } catch {
    return false;
  }
}

/** Asks the OS for permission. Call this only from a user action (e.g. flipping a switch), never at launch. */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'LockedIn reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

/** Cancels everything and re-schedules the given plan, so the OS queue always mirrors current state. */
export async function applyNotificationPlan(plan: PlannedNotification[]): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    for (const item of plan) {
      await Notifications.scheduleNotificationAsync({
        identifier: item.id,
        content: { title: item.title, body: item.body },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: item.fireAt,
          ...(Platform.OS === 'android' ? { channelId: 'default' } : {}),
        },
      });
    }
  } catch (error) {
    // Local reminders are best-effort; a scheduling failure must never break the app.
    console.warn('Could not schedule notifications:', error);
  }
}
