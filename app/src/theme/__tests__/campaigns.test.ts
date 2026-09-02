import { campaigns } from '../campaigns';
import { contrastRatio, wcagAA } from '../contrast';
import { palette } from '../colors';

/**
 * Regression protection for the claim documented in campaigns.ts's header comment: every
 * accent clears the 3:1 non-text minimum against the Obsidian surface, used for icon tint,
 * borders, progress fill, and check controls. If someone edits an accent hex, this fails
 * instead of the comment silently going stale.
 */
describe('campaign accent contrast against Obsidian surface', () => {
  it.each(Object.entries(campaigns))(
    '%s clears the WCAG 3:1 non-text minimum',
    (_key, campaign) => {
      const ratio = contrastRatio(campaign.accent, palette.obsidian);
      expect(ratio).toBeGreaterThanOrEqual(wcagAA.largeTextOrNonText);
    },
  );

  it('flags the two accents known to fall short of 4.5:1 body-text contrast', () => {
    // Documented in campaigns.ts — Improve Health and Personal Growth are safe for non-text use
    // only. This test exists to catch the day someone "fixes" one without updating the comment.
    expect(contrastRatio(campaigns.improveHealth.accent, palette.obsidian)).toBeLessThan(
      wcagAA.normalText,
    );
    expect(contrastRatio(campaigns.personalGrowth.accent, palette.obsidian)).toBeLessThan(
      wcagAA.normalText,
    );
  });
});
