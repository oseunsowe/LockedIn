import { useSyncExternalStore } from 'react';

import { defaultNotificationPrefs, type NotificationPrefs } from '@/lib/notificationPlan';

const STORAGE_KEY = 'lockedin.notificationPrefs';

function load(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultNotificationPrefs;
    return { ...defaultNotificationPrefs, ...(JSON.parse(raw) as Partial<NotificationPrefs>) };
  } catch {
    return defaultNotificationPrefs;
  }
}

let prefs: NotificationPrefs = load();
const listeners = new Set<() => void>();

export function getNotificationPrefs(): NotificationPrefs {
  return prefs;
}

export function updateNotificationPrefs(patch: Partial<NotificationPrefs>) {
  prefs = { ...prefs, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Persistence is a convenience; in-memory prefs still apply for this session.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useNotificationPrefs(): NotificationPrefs {
  return useSyncExternalStore(subscribe, getNotificationPrefs, getNotificationPrefs);
}
