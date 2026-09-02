/**
 * Font family names as registered by useFonts in app/_layout.tsx. Keep these in sync with the
 * Font.useFonts() call — a mismatch here silently falls back to the system font.
 */
export const fontFamily = {
  displayRegular: 'Outfit_400Regular',
  displaySemiBold: 'Outfit_600SemiBold',
  displayBold: 'Outfit_700Bold',
  displayExtraBold: 'Outfit_800ExtraBold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  monoRegular: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  monoSemiBold: 'JetBrainsMono_600SemiBold',
} as const;

/**
 * Type scale. `data` is JetBrains Mono ONLY — reserved for HUD-style values (LVL 14, +500 XP,
 * STEP 3 OF 4, ~8,000 XP/wk). Using mono anywhere else, or body/display for data values,
 * breaks the "game HUD" read that makes this UI distinct from a generic productivity app.
 */
export const type = {
  display: {
    fontFamily: fontFamily.displayBold,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  displayLarge: {
    fontFamily: fontFamily.displayBold,
    fontSize: 48,
    lineHeight: 54,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fontFamily.displaySemiBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  data: {
    fontFamily: fontFamily.monoSemiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.96, // +8%
    textTransform: 'uppercase',
  },
} as const;
