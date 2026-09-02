/** WCAG 2.1 relative luminance of a `#RRGGBB` color. */
export function relativeLuminance(hex: string): number {
  const clean = hex.replace('#', '');
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(clean.substring(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  const [r, g, b] = channels;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.1 contrast ratio between two `#RRGGBB` colors, order-independent. */
export function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.1 AA thresholds. Normal text needs 4.5:1; large text (≥24px) and non-text UI need 3:1. */
export const wcagAA = {
  normalText: 4.5,
  largeTextOrNonText: 3,
} as const;
