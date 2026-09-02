import { Platform, type ViewStyle } from 'react-native';

import { withAlpha } from './colors';

type GlowOptions = {
  /** Blur radius in px. Default 20 — soft, not a hard drop shadow. */
  blur?: number;
  /** How far the glow extends past the element's edge. Default 4. */
  spread?: number;
  /** Alpha of the glow color. Default 0.45 — visible but not neon. */
  opacity?: number;
};

/**
 * Soft colored glow — every primary CTA and active tier ring uses this. One function instead of
 * re-deriving iOS shadow* / Android elevation per screen (TODO.md §1.4).
 *
 * RN 0.86 (New Architecture, on by default here — see app.json's `newArchEnabled`) ships a real
 * cross-platform `boxShadow` style prop (react-native/Libraries/StyleSheet/StyleSheetTypes.d.ts,
 * not an `experimental_` one) that supports a colored, blurred shadow on both iOS and Android —
 * this is the actual "solve once, centrally" answer, not a workaround. `shadowColor` / `shadowOpacity`
 * / `shadowRadius` / `shadowOffset` (iOS) and a flat `elevation` (Android, uncolored — the OS doesn't
 * tint it) are layered in underneath as a fallback for the Old Architecture / any renderer that
 * doesn't yet honor `boxShadow`. Belt and suspenders, not a guess: unrecognized style keys are
 * silently ignored on native rather than erroring, so carrying both costs nothing when `boxShadow`
 * is honored, and still degrades to *something* when it isn't.
 */
export function glow(color: string, options: GlowOptions = {}): ViewStyle {
  const { blur = 20, spread = 4, opacity = 0.45 } = options;

  return {
    boxShadow: [
      {
        offsetX: 0,
        offsetY: 0,
        color: withAlpha(color, opacity),
        blurRadius: blur,
        spreadDistance: spread,
      },
    ],
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: opacity,
    shadowRadius: blur / 2,
    ...Platform.select<ViewStyle>({ android: { elevation: 8 }, default: {} }),
  };
}
