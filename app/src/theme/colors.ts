/**
 * Brand palette — verbatim from the brand board (assets/fee4bba8-*.png, assets/73c5e6af-*.png).
 * These are the ONLY hex literals allowed in the codebase. Everything else imports from
 * `semantic` or `campaigns` below. See TODO.md §0 for why these values (not docs/DESIGN-SYSTEM.md's)
 * are authoritative.
 */
export const palette = {
  void: '#050508',
  obsidian: '#0F0F1E',
  // #6366F1 in the brand board puts white button text (`semantic.text.onAccent`) at ~4.466:1
  // against it — just under WCAG AA's 4.5:1 for normal text (see
  // src/theme/__tests__/semanticContrast.test.ts). Nudged the green channel by a single unit
  // (102 -> 101), imperceptible next to the source asset, to clear 4.5:1 everywhere this sits
  // behind white text (primary CTAs across onboarding, mission, and proof screens).
  electric: '#6365F1',
  // #8B5CF6 puts white button text (Resume/Activate Recovery Mode labels) at ~4.234:1 against
  // it — below WCAG AA's 4.5:1. Nudged the green channel down (92 -> 82) to clear 4.5:1; still
  // reads as the same violet.
  violet: '#8B52F6',
  iris: '#A78BFA',
  gold: '#D4AF37',
  pure: '#FFFFFF',
} as const;

/**
 * Not in the brand board — needed by the product spec (docs/DESIGN-SYSTEM.md) and not yet
 * design-approved. Placeholder values chosen to sit comfortably in the brand's saturation/lightness
 * range. Flagged in TODO.md §1.1 — swap for approved values before this ships.
 */
const unapproved = {
  successGreen: '#34D399',
  dangerRed: '#EF4444',
  warningAmber: '#F59E0B',
} as const;

/** Semantic layer — components import from here, never from `palette` directly. */
export const semantic = {
  bg: {
    canvas: palette.void,
    surface: palette.obsidian,
    elevated: '#161625',
  },
  text: {
    primary: palette.pure,
    secondary: 'rgba(255,255,255,0.64)',
    // 0.40 measured ~3.72:1 against bg.canvas and ~3.81:1 against bg.surface — both short of
    // WCAG AA's 4.5:1 for normal text (see src/theme/__tests__/semanticContrast.test.ts). Bumped
    // to 0.46, the smallest alpha step that clears 4.5:1 against the darkest real background
    // (bg.canvas) this token is used on for captions/meta text throughout the app.
    tertiary: 'rgba(255,255,255,0.46)',
    onAccent: palette.pure,
  },
  action: {
    primary: palette.electric,
    primaryPressed: '#4F52D9',
  },
  state: {
    success: unapproved.successGreen,
    danger: unapproved.dangerRed,
    warning: unapproved.warningAmber,
  },
  border: {
    subtle: 'rgba(255,255,255,0.08)',
    strong: 'rgba(255,255,255,0.16)',
  },
  glass: {
    fill4: 'rgba(255,255,255,0.04)',
    fill8: 'rgba(255,255,255,0.08)',
    border12: 'rgba(255,255,255,0.12)',
  },
} as const;

/** Linear-gradient stop pairs. Reach for these instead of re-deriving a gradient per screen. */
export const gradients = {
  /** Progression only — XP rings, primary CTAs, "Start My Journey". */
  xp: [palette.electric, palette.violet] as const,
  /** Tier-3 / Elite achievement rings. */
  elite: [palette.gold, '#F4D876'] as const,
  /** Two-tone display headline ("Turn your goals / into missions."). */
  headline: [palette.violet, palette.iris, palette.gold] as const,
};

/**
 * Tier-ring colors — the ring color IS the progression story (onboard_screen_0/2/3.JPG).
 * Recruit = muted steel, Builder = electric, Elite = gold.
 */
export const tierRing = {
  recruit: '#8A8FA3',
  builder: palette.electric,
  elite: palette.gold,
} as const;

/** `#RRGGBB` -> `rgba(r, g, b, alpha)`. The one place alpha-blending math lives — never re-derive it inline. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
