import type {
  CampaignKey,
  IdentityClass,
  MissionDifficulty,
  MissionType,
  ProofType,
} from '@/lib/database.types';

export type MissionTemplate = {
  id: string;
  title: string;
  type: MissionType;
  campaign: CampaignKey;
  difficulty: MissionDifficulty;
  proof: ProofType[];
};

function t(
  campaign: CampaignKey,
  slug: string,
  title: string,
  type: MissionType,
  difficulty: MissionDifficulty,
  proof: ProofType[],
): MissionTemplate {
  return { id: `${campaign}-${slug}`, title, type, campaign, difficulty, proof };
}

/** Curated starting points, three per goal. Tapping one pre-fills the mission form. */
export const missionTemplates: MissionTemplate[] = [
  t(
    'careerGrowth',
    'cert',
    'Finish one lesson toward your next certification',
    'side',
    'standard',
    ['screenshot'],
  ),
  t(
    'careerGrowth',
    'portfolio',
    'Update your portfolio with a recent project',
    'main',
    'challenging',
    ['screenshot'],
  ),
  t('careerGrowth', 'network', 'Message 3 people in your industry', 'daily', 'standard', [
    'screenshot',
  ]),

  t('buildBusiness', 'landing', 'Ship the landing page', 'main', 'hard', ['screenshot']),
  t('buildBusiness', 'outreach', 'Reach out to 10 potential customers', 'side', 'challenging', [
    'screenshot',
  ]),
  t('buildBusiness', 'offer', 'Write and publish your core offer', 'main', 'challenging', ['file']),

  t('learnSkill', 'practice', 'Practice for 30 focused minutes', 'daily', 'standard', ['photo']),
  t('learnSkill', 'module', 'Complete one course module', 'side', 'challenging', ['screenshot']),
  t('learnSkill', 'teach', 'Explain what you learned out loud', 'side', 'standard', ['voice']),

  t('improveFitness', 'workout', 'Morning workout', 'daily', 'standard', ['photo']),
  t('improveFitness', 'run', 'Run 5K', 'side', 'challenging', ['screenshot']),
  t('improveFitness', 'steps', 'Hit 10,000 steps today', 'daily', 'standard', ['screenshot']),

  t('increaseIncome', 'budget', 'Review this month’s budget', 'side', 'standard', ['file']),
  t('increaseIncome', 'sales', 'Close a sales call', 'main', 'hard', ['screenshot']),
  t('increaseIncome', 'side-income', 'Spend 1 hour on your side income', 'daily', 'standard', [
    'photo',
  ]),

  t('createContent', 'write', 'Write 800 words', 'side', 'standard', ['file']),
  t('createContent', 'publish', 'Publish one piece of content', 'main', 'challenging', [
    'screenshot',
  ]),
  t('createContent', 'batch', 'Batch-record 3 short videos', 'side', 'hard', ['screenshot']),

  t('improveHealth', 'water', 'Drink 3L of water', 'daily', 'standard', ['photo']),
  t('improveHealth', 'mealprep', 'Meal prep for the week', 'side', 'challenging', ['photo']),
  t('improveHealth', 'sleep', 'In bed by 10:30 PM', 'daily', 'standard', ['screenshot']),

  t('personalGrowth', 'read', 'Read for 30 minutes', 'daily', 'standard', ['photo']),
  t('personalGrowth', 'nosocial', 'No social media before noon', 'daily', 'hard', ['voice']),
  t('personalGrowth', 'journal', 'Journal your wins and one lesson', 'daily', 'standard', [
    'photo',
  ]),
];

const classCampaigns: Record<IdentityClass, CampaignKey[]> = {
  developer: ['careerGrowth', 'learnSkill', 'buildBusiness'],
  founder: ['buildBusiness', 'increaseIncome', 'careerGrowth'],
  creator: ['createContent', 'buildBusiness', 'personalGrowth'],
  student: ['learnSkill', 'personalGrowth', 'improveHealth'],
  athlete: ['improveFitness', 'improveHealth', 'personalGrowth'],
  professional: ['careerGrowth', 'increaseIncome', 'personalGrowth'],
  entrepreneur: ['buildBusiness', 'increaseIncome', 'createContent'],
  designer: ['createContent', 'careerGrowth', 'learnSkill'],
};

export type MissionIdea = MissionTemplate & {
  /** One line on why this was suggested, shown under the title. */
  reason: string;
};

function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = a;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Personalized mission suggestions. This is a local rule-based engine over the user's own goals,
 * identity class and time of day - not a live Claude call (that would need a server-side Edge
 * Function, like verify-proof). `seed` lets "Refresh ideas" reshuffle deterministically.
 */
export function generateMissionIdeas(params: {
  identityClass: IdentityClass | null;
  goals: CampaignKey[];
  hour: number;
  seed: number;
  count?: number;
}): MissionIdea[] {
  const { identityClass, goals, hour, seed, count = 6 } = params;
  const rng = mulberry(seed);
  const classPicks = identityClass ? classCampaigns[identityClass] : [];

  const scored = missionTemplates.map((template) => {
    let score = rng() * 2;
    let reason = 'A good next step';
    if (goals.includes(template.campaign)) {
      score += 6;
      reason = 'Matches one of your goals';
    } else if (classPicks.includes(template.campaign)) {
      score += 3;
      reason = `Popular with ${identityClass}s`;
    }
    if (hour < 11 && template.type === 'daily') {
      score += 1.5;
      reason = reason === 'A good next step' ? 'A strong way to start the day' : reason;
    }
    if (hour >= 17 && template.type === 'main') score -= 1.5;
    return { template, score, reason };
  });

  const picked: MissionIdea[] = [];
  const perCampaign = new Map<CampaignKey, number>();
  for (const item of scored.sort((a, b) => b.score - a.score)) {
    const used = perCampaign.get(item.template.campaign) ?? 0;
    if (used >= 2) continue;
    perCampaign.set(item.template.campaign, used + 1);
    picked.push({ ...item.template, reason: item.reason });
    if (picked.length === count) break;
  }
  return picked;
}
