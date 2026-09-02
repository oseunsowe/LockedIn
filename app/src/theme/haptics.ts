import * as Haptics from 'expo-haptics';

import { hapticEvent } from './motion';

type HapticEventName = keyof typeof hapticEvent;

/** Fire the haptic mapped to a semantic event. Screens call `fireHaptic('missionComplete')`, never expo-haptics directly. */
export function fireHaptic(name: HapticEventName): void {
  switch (hapticEvent[name]) {
    case 'selection':
      Haptics.selectionAsync();
      return;
    case 'notificationSuccess':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    case 'notificationWarning':
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
  }
}
