import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { Easing } from 'react-native-reanimated';

export const duration = {
  instant: 120,
  quick: 220,
  smooth: 400,
  celebrate: 800,
} as const;

export const easing = {
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  accelerate: Easing.bezier(0.4, 0, 1, 1),
} as const;

/** Spring presets for card press, ring fill, XP count-up. Pass to `withSpring`. */
export const spring = {
  press: { damping: 18, stiffness: 260, mass: 0.6 },
  ringFill: { damping: 16, stiffness: 90, mass: 1 },
  xpCountUp: { damping: 20, stiffness: 120, mass: 1 },
  celebrate: { damping: 10, stiffness: 140, mass: 1 },
} as const;

/**
 * Reads the OS-level "reduce motion" accessibility setting and keeps it live. Gate every
 * celebration animation (level-up, XP burst, verification) on this — do not retrofit later.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

/** Haptic pattern map — semantic event name -> expo-haptics call. See src/theme/haptics.ts. */
export const hapticEvent = {
  selectionTick: 'selection',
  missionComplete: 'notificationSuccess',
  levelUp: 'notificationSuccess',
  verificationSuccess: 'notificationSuccess',
  verificationFailed: 'notificationWarning',
} as const;
