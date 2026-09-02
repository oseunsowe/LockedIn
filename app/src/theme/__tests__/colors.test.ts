import { withAlpha } from '../colors';

describe('withAlpha', () => {
  it('converts a hex color to an rgba string at the given alpha', () => {
    expect(withAlpha('#6366F1', 0.5)).toBe('rgba(99, 102, 241, 0.5)');
  });

  it('handles hex without a leading #', () => {
    expect(withAlpha('D4AF37', 1)).toBe('rgba(212, 175, 55, 1)');
  });
});
