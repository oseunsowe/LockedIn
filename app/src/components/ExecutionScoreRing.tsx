import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import {
  duration,
  easing,
  gradients,
  palette,
  semantic,
  space,
  type,
  useReducedMotion,
} from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 176;
const STROKE_WIDTH = 14;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type ExecutionScoreRingProps = {
  /** `profiles.execution_score`, 0–100. See TODO.md §6 — the formula itself is still undefined
   * (Phase 6 P0 "define the formula explicitly and document it"); this component only renders
   * whatever value the backend computes. */
  score: number;
};

/**
 * The dashboard's hero ring (TODO.md §6). Reduced-motion users get the final ring position and
 * number immediately — no arc sweep, no count-up — per `theme/motion.ts`'s `useReducedMotion()`
 * contract ("gate every celebration animation... do not retrofit later").
 */
export function ExecutionScoreRing({ score }: ExecutionScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(reducedMotion ? clamped : 0);
  const [displayValue, setDisplayValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) {
      progress.value = clamped;
      return;
    }

    progress.value = withTiming(clamped, {
      duration: duration.celebrate * 2,
      easing: easing.decelerate,
    });

    const start = Date.now();
    const countUpMs = duration.celebrate * 2;
    function tick() {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / countUpMs);
      setDisplayValue(Math.round(clamped * t));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the score itself changes
  }, [clamped, reducedMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value / 100),
  }));

  const shownValue = reducedMotion ? Math.round(clamped) : displayValue;

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Execution score ${Math.round(clamped)} percent`}
    >
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Defs>
          <LinearGradient id="executionScoreGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={gradients.xp[0]} />
            <Stop offset="1" stopColor={gradients.xp[1]} />
          </LinearGradient>
        </Defs>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={semantic.border.subtle}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#executionScoreGradient)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          animatedProps={animatedProps}
          // Start the arc at 12 o'clock, not 3 o'clock (SVG circles default to starting at 0deg = right).
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.value}>{shownValue}</Text>
        <Text style={styles.label}>TODAY&rsquo;S PERFORMANCE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  center: {
    alignItems: 'center',
    gap: space.xs,
  },
  value: {
    ...type.displayLarge,
    color: semantic.text.primary,
  },
  label: {
    ...type.data,
    color: palette.iris,
    maxWidth: SIZE - STROKE_WIDTH * 4,
    textAlign: 'center',
  },
});
