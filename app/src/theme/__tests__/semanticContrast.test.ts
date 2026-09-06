import { palette, semantic } from '../colors';
import { contrastRatio, wcagAA } from '../contrast';

/**
 * Regression protection for TODO.md §14.2's "contrast pairs not verified beyond one existing
 * test" gap. `campaigns.test.ts` already covers campaign accents against Obsidian; this covers
 * the semantic text/background pairs actually rendered across the app's real screens (dashboard,
 * missions, proof, verification, onboarding, profile, etc.) — every one asserted against the
 * stricter 4.5:1 "normal text" WCAG AA threshold rather than trying to special-case which text is
 * large enough to only need 3:1.
 *
 * `semantic.text.secondary`/`tertiary` are translucent white (`rgba(255,255,255,a)`), so a plain
 * `contrastRatio(fg, bg)` call would be wrong — the color actually rendered on screen is the
 * alpha-composite of that translucent foreground over its background, not the un-blended rgba
 * itself. `compositeOverHex` performs that blend before handing both opaque colors to
 * `contrastRatio`, matching what a screen (and a real contrast checker) would measure.
 */
function compositeOverHex(fg: string, bgHex: string): string {
  const bg = bgHex.replace('#', '');
  const bgR = parseInt(bg.substring(0, 2), 16);
  const bgG = parseInt(bg.substring(2, 4), 16);
  const bgB = parseInt(bg.substring(4, 6), 16);

  const rgbaMatch = fg.match(/rgba?\(([^)]+)\)/);
  if (!rgbaMatch) return fg; // Already an opaque #RRGGBB literal — nothing to blend.

  const parts = rgbaMatch[1]!.split(',').map((s) => parseFloat(s.trim()));
  const r = parts[0] ?? 0;
  const g = parts[1] ?? 0;
  const b = parts[2] ?? 0;
  const a = parts.length > 3 ? (parts[3] ?? 1) : 1;
  const blend = (fgChannel: number, bgChannel: number) =>
    Math.round(a * fgChannel + (1 - a) * bgChannel);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(blend(r, bgR))}${toHex(blend(g, bgG))}${toHex(blend(b, bgB))}`;
}

type Pair = { name: string; fg: string; bg: string };

const pairs: Pair[] = [
  // `semantic.text.primary` — titles, headings, values — against every real surface it sits on.
  { name: 'text.primary on bg.canvas', fg: semantic.text.primary, bg: semantic.bg.canvas },
  { name: 'text.primary on bg.surface', fg: semantic.text.primary, bg: semantic.bg.surface },
  { name: 'text.primary on bg.elevated', fg: semantic.text.primary, bg: semantic.bg.elevated },

  // `semantic.text.secondary` — subtitles, body copy.
  { name: 'text.secondary on bg.canvas', fg: semantic.text.secondary, bg: semantic.bg.canvas },
  { name: 'text.secondary on bg.surface', fg: semantic.text.secondary, bg: semantic.bg.surface },

  // `semantic.text.tertiary` — captions/meta text, the most-used muted token in the app.
  { name: 'text.tertiary on bg.canvas', fg: semantic.text.tertiary, bg: semantic.bg.canvas },
  { name: 'text.tertiary on bg.surface', fg: semantic.text.tertiary, bg: semantic.bg.surface },
  { name: 'text.tertiary on bg.elevated', fg: semantic.text.tertiary, bg: semantic.bg.elevated },

  // `semantic.text.onAccent` — white button labels on the app's two solid accent-button fills
  // (primary CTAs via `semantic.action.primary`, and the Resume/Activate Recovery Mode buttons
  // on `palette.violet`).
  {
    name: 'text.onAccent on action.primary (primary CTA buttons)',
    fg: semantic.text.onAccent,
    bg: semantic.action.primary,
  },
  {
    name: 'text.onAccent on palette.violet (Resume / Recovery buttons)',
    fg: semantic.text.onAccent,
    bg: palette.violet,
  },

  // Inline status colors used directly as text color, not just tint/border.
  {
    name: 'state.danger on bg.canvas (inline error text)',
    fg: semantic.state.danger,
    bg: semantic.bg.canvas,
  },
  {
    name: 'state.danger on bg.surface (Sign Out label)',
    fg: semantic.state.danger,
    bg: semantic.bg.surface,
  },
  {
    name: 'state.warning on bg.canvas (overdue countdown)',
    fg: semantic.state.warning,
    bg: semantic.bg.canvas,
  },
  {
    name: 'state.success on bg.surface (mission history status chip)',
    fg: semantic.state.success,
    bg: semantic.bg.surface,
  },

  // `semantic.action.primary` used directly as a foreground (onboarding icon tints) against
  // canvas.
  {
    name: 'action.primary on bg.canvas (accent-colored labels)',
    fg: semantic.action.primary,
    bg: semantic.bg.canvas,
  },
];

describe('semantic text/background contrast across real screens', () => {
  it.each(pairs)('$name clears WCAG AA 4.5:1', ({ fg, bg }) => {
    const effectiveFg = compositeOverHex(fg, bg);
    const ratio = contrastRatio(effectiveFg, bg);
    expect(ratio).toBeGreaterThanOrEqual(wcagAA.normalText);
  });
});
