import type { IconName } from './icons';

/**
 * Campaign accent colors — pixel-sampled from the goal-selection mockups
 * (assets/onboard_screen_7.JPG, assets/onboard_screen_8.JPG), not eyeballed.
 * Each row's border, icon tile, progress bar, and check control recolor to its accent on selection.
 *
 * Contrast note (WCAG 2.1 vs. `semantic.bg.surface` #0F0F1E): every accent clears 4.5:1 EXCEPT
 * Improve Health (4.47:1) and Personal Growth (4.43:1), which clear the 3:1 non-text minimum but
 * fall just short of 4.5:1 for body text. Safe for icon tint, borders, progress fill, and check
 * controls (all non-text). Do NOT set body-size label text directly in an accent color — labels
 * stay white/secondary-gray per the mockup.
 */
export const campaigns = {
  careerGrowth: { label: 'Career Growth', accent: '#3A83E8', icon: 'activity' as IconName },
  buildBusiness: { label: 'Build a Business', accent: '#D5AE36', icon: 'gem' as IconName },
  learnSkill: { label: 'Learn a Skill', accent: '#0FB3CA', icon: 'clock' as IconName },
  improveFitness: { label: 'Improve Fitness', accent: '#ED7723', icon: 'dumbbell' as IconName },
  increaseIncome: { label: 'Increase Income', accent: '#1DAA7C', icon: 'trending-up' as IconName },
  createContent: { label: 'Create Content', accent: '#DE4B92', icon: 'play' as IconName },
  improveHealth: { label: 'Improve Health', accent: '#D64764', icon: 'heart' as IconName },
  personalGrowth: { label: 'Personal Growth', accent: '#885FED', icon: 'sun' as IconName },
} as const;

export type CampaignKey = keyof typeof campaigns;
