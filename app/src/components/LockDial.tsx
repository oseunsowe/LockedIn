import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing as ReanimatedEasing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Stop } from 'react-native-svg';

import { duration, easing, gradients, semantic, useReducedMotion, withAlpha } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type LockDialProps = {
  /** Outer diameter in px. */
  size: number;
  /** 0-1 — the fraction of the ring that reads as "still ahead" (1 = full time left, 0 = none). */
  progress: number;
  strokeWidth?: number;
  /** Gradient stops for the filled arc. Defaults to the app's XP gradient (electric → violet). */
  colors?: readonly [string, string];
  trackColor?: string;
  /** Renders the vault-dial tick marks around the circumference. Default true. */
  ticks?: boolean;
  tickCount?: number;
  /** Layers a slow pulsing ring on top — the shared cue for "running out of time," independent of
   * `colors` (which always carries the difficulty tier's meaning, never urgency). */
  urgent?: boolean;
  urgentColor?: string;
  /**
   * Must be unique among LockDials rendered at once (each is its own `<Svg>`, but a stable,
   * instance-specific id keeps gradient lookups unambiguous — e.g. `` `dial-${mission.id}` ``).
   */
  gradientId: string;
  children?: ReactNode;
};

/**
 * The app's signature motif: a rotary vault-dial ring standing in for every countdown/progress
 * indicator — mission-card corner, Main Quest hero, Focus Mode's centerpiece, and (fully closed,
 * gold) the verification moment. One shape at every scale, so "how much is left" always reads the
 * same way regardless of where it appears.
 */
export function LockDial({
  size,
  progress,
  strokeWidth,
  colors,
  trackColor = semantic.border.subtle,
  ticks = true,
  tickCount = 24,
  urgent = false,
  urgentColor = semantic.state.danger,
  gradientId,
  children,
}: LockDialProps) {
  const reducedMotion = useReducedMotion();
  const sw = strokeWidth ?? Math.max(2.5, size / 16);
  const radius = (size - sw) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));
  const [gradientStart, gradientEnd] = colors ?? gradients.xp;

  const fill = useSharedValue(reducedMotion ? clamped : 0);
  const pulse = useSharedValue(urgent ? 0.5 : 0);

  useEffect(() => {
    fill.value = reducedMotion
      ? clamped
      : withTiming(clamped, { duration: duration.smooth, easing: easing.decelerate });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable refs
  }, [clamped, reducedMotion]);

  useEffect(() => {
    if (!urgent || reducedMotion) {
      pulse.value = urgent ? 0.5 : 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: ReanimatedEasing.inOut(ReanimatedEasing.quad) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shared values are stable refs
  }, [urgent, reducedMotion]);

  const arcProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - fill.value),
  }));

  const pulseProps = useAnimatedProps(() => ({
    opacity: 0.2 + pulse.value * 0.4,
  }));

  const center = size / 2;
  const tickLines = ticks
    ? Array.from({ length: tickCount }, (_, i) => {
        const angle = (i / tickCount) * 2 * Math.PI;
        const outerR = radius + sw / 2 + 3;
        const innerR = outerR - 3;
        return {
          key: i,
          x1: center + innerR * Math.cos(angle),
          y1: center + innerR * Math.sin(angle),
          x2: center + outerR * Math.cos(angle),
          y2: center + outerR * Math.sin(angle),
        };
      })
    : [];

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={gradientStart} />
            <Stop offset="100%" stopColor={gradientEnd} />
          </LinearGradient>
        </Defs>
        {tickLines.map((t) => (
          <Line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke={withAlpha('#FFFFFF', 0.14)}
            strokeWidth={1}
          />
        ))}
        {urgent ? (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius + sw / 2 + 2}
            stroke={urgentColor}
            strokeWidth={1.5}
            fill="none"
            animatedProps={pulseProps}
          />
        ) : null}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={sw}
          fill="none"
        />
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#${gradientId})`}
          strokeWidth={sw}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={arcProps}
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      {children ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          {children}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
