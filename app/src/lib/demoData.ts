import type {
  CampaignKey,
  MissionDifficulty,
  MissionStatus,
  MissionType,
} from '@/lib/database.types';
import { xpForLevel } from '@/lib/leveling';
import type { Mission } from '@/lib/missions';
import type { FocusStats } from '@/lib/focusStats';
import type { GrowthTrend } from '@/lib/progressStats';
import type { IconName } from '@/theme';

/** Small deterministic PRNG (mulberry32) — same seed, same account; new seed, new account. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function int(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

const HOUR = 60 * 60 * 1000;

const xpByDifficulty: Record<MissionDifficulty, number> = {
  standard: 100,
  challenging: 250,
  hard: 500,
  epic: 1000,
};

type Template = {
  title: string;
  type: MissionType;
  campaign: CampaignKey;
  proof: 'photo' | 'screenshot' | 'file' | 'voice';
};

const templates: Template[] = [
  { title: 'Ship the landing page', type: 'main', campaign: 'buildBusiness', proof: 'screenshot' },
  { title: 'Finish the investor deck', type: 'main', campaign: 'careerGrowth', proof: 'file' },
  {
    title: 'Publish the launch video',
    type: 'main',
    campaign: 'createContent',
    proof: 'screenshot',
  },
  { title: 'Close 3 sales calls', type: 'main', campaign: 'increaseIncome', proof: 'screenshot' },
  {
    title: 'Complete the React course module',
    type: 'main',
    campaign: 'learnSkill',
    proof: 'screenshot',
  },
  { title: 'Morning workout', type: 'daily', campaign: 'improveFitness', proof: 'photo' },
  { title: 'Read for 30 minutes', type: 'daily', campaign: 'personalGrowth', proof: 'photo' },
  {
    title: 'No social media before noon',
    type: 'daily',
    campaign: 'personalGrowth',
    proof: 'voice',
  },
  { title: 'Drink 3L of water', type: 'daily', campaign: 'improveHealth', proof: 'photo' },
  { title: 'Meal prep for the week', type: 'side', campaign: 'improveHealth', proof: 'photo' },
  {
    title: 'Refactor the auth module',
    type: 'side',
    campaign: 'careerGrowth',
    proof: 'screenshot',
  },
  { title: 'Write 800 words', type: 'side', campaign: 'createContent', proof: 'file' },
  { title: 'Practice Spanish — 20 min', type: 'side', campaign: 'learnSkill', proof: 'voice' },
  {
    title: 'Update the pricing page',
    type: 'side',
    campaign: 'buildBusiness',
    proof: 'screenshot',
  },
  { title: 'Review monthly budget', type: 'side', campaign: 'increaseIncome', proof: 'file' },
  { title: '5K run', type: 'side', campaign: 'improveFitness', proof: 'screenshot' },
];

const difficulties: MissionDifficulty[] = ['standard', 'standard', 'challenging', 'hard', 'epic'];

function buildMission(
  rng: () => number,
  userId: string,
  index: number,
  template: Template,
  status: MissionStatus,
  now: number,
): Mission {
  const difficulty = pick(rng, difficulties);
  const created = new Date(now - int(rng, 6, 300) * HOUR);
  const deadline =
    status === 'active'
      ? new Date(now + int(rng, 2, 72) * HOUR)
      : new Date(created.getTime() + int(rng, 12, 96) * HOUR);
  const completedAt =
    status === 'completed' ? new Date(created.getTime() + int(rng, 3, 60) * HOUR) : null;
  return {
    id: `demo-${status}-${index}`,
    user_id: userId,
    campaign_key: template.campaign,
    type: template.type,
    title: template.title,
    difficulty,
    status,
    xp_reward: xpByDifficulty[difficulty],
    proof_requirements: [{ type: template.proof }],
    deadline: deadline.toISOString(),
    start_time: null,
    end_time: null,
    created_at: created.toISOString(),
    completed_at: completedAt?.toISOString() ?? null,
  };
}

function shuffled<T>(rng: () => number, items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export type DemoProfileStats = {
  level: number;
  xp_total: number;
  streak_count: number;
  execution_score: number;
};

export function demoProfileStats(seed: number): DemoProfileStats {
  const rng = makeRng(seed);
  const level = int(rng, 9, 34);
  const span = xpForLevel(level + 1) - xpForLevel(level);
  return {
    level,
    xp_total: xpForLevel(level) + Math.floor(span * (0.2 + rng() * 0.7)),
    streak_count: int(rng, 4, 47),
    execution_score: int(rng, 72, 96),
  };
}

/** Active board: one Main Quest, a few side missions and dailies, occasionally one due soon. */
export function demoActiveMissions(seed: number, userId = 'demo-user'): Mission[] {
  const rng = makeRng(seed + 101);
  const now = Date.now();
  const mains = shuffled(
    rng,
    templates.filter((t) => t.type === 'main'),
  );
  const sides = shuffled(
    rng,
    templates.filter((t) => t.type === 'side'),
  );
  const dailies = shuffled(
    rng,
    templates.filter((t) => t.type === 'daily'),
  );
  const chosen = [
    mains[0]!,
    ...sides.slice(0, int(rng, 2, 3)),
    ...dailies.slice(0, int(rng, 2, 3)),
  ];
  const missions = chosen.map((template, index) =>
    buildMission(rng, userId, index, template, 'active', now),
  );
  if (rng() > 0.4 && missions[1]) {
    missions[1] = { ...missions[1], deadline: new Date(now + int(rng, 1, 3) * HOUR).toISOString() };
  }
  return missions;
}

export function demoRecoveryMissions(seed: number, userId = 'demo-user'): Mission[] {
  const rng = makeRng(seed + 202);
  const template = pick(
    rng,
    templates.filter((t) => t.type !== 'main'),
  );
  return [buildMission(rng, userId, 0, template, 'recovery', Date.now())];
}

export function demoMissionHistory(seed: number, userId = 'demo-user'): Mission[] {
  const rng = makeRng(seed + 303);
  const now = Date.now();
  const count = int(rng, 14, 22);
  const history: Mission[] = [];
  for (let i = 0; i < count; i++) {
    const status: MissionStatus = rng() < 0.86 ? 'completed' : 'recovery';
    history.push(buildMission(rng, userId, i, pick(rng, templates), status, now));
  }
  return history.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export type DemoProgressStats = {
  consistencyPct: number;
  completionRatePct: number | null;
  growthTrend: GrowthTrend;
};

export function demoProgressStats(seed: number): DemoProgressStats {
  const rng = makeRng(seed + 404);
  const lastWeekXp = int(rng, 900, 2200);
  const growthTrendPct = int(rng, 6, 42);
  return {
    consistencyPct: int(rng, 68, 96),
    completionRatePct: int(rng, 78, 96),
    growthTrend: {
      lastWeekXp,
      thisWeekXp: Math.round(lastWeekXp * (1 + growthTrendPct / 100)),
      growthTrendPct,
    },
  };
}

export type DemoTodayStats = {
  missionsDone: number;
  missionsTotal: number;
  xpToday: number;
  focusMinutes: number;
};

export function demoTodayStats(seed: number): DemoTodayStats {
  const rng = makeRng(seed + 505);
  const missionsTotal = int(rng, 4, 7);
  return {
    missionsDone: int(rng, 1, missionsTotal - 1),
    missionsTotal,
    xpToday: int(rng, 3, 14) * 50,
    focusMinutes: int(rng, 35, 190),
  };
}

export function demoFocusStats(seed: number): FocusStats {
  const rng = makeRng(seed + 808);
  return {
    weekSeconds: int(rng, 9, 26) * 60 * 60 * 0.5 * 2,
    todaySeconds: int(rng, 35, 190) * 60,
    sessions: int(rng, 8, 19),
  };
}

export type DemoAchievement = {
  key: string;
  label: string;
  description: string;
  icon: IconName;
  unlocked: boolean;
  unlockedAt: string | null;
};

const achievementCatalog: Omit<DemoAchievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    key: 'first_mission',
    label: 'First Mission',
    description: 'Complete your first mission.',
    icon: 'verified',
  },
  {
    key: 'thirty_day_streak',
    label: '30 Day Streak',
    description: 'Keep a 30-day streak alive.',
    icon: 'streak',
  },
  {
    key: 'deep_focus_master',
    label: 'Deep Focus Master',
    description: 'Complete 10 missions in Active Mission Mode.',
    icon: 'timer',
  },
  {
    key: 'early_riser',
    label: 'Early Riser',
    description: 'Finish a mission before 8 AM.',
    icon: 'sun',
  },
  {
    key: 'screenshot_sleuth',
    label: 'Screenshot Sleuth',
    description: 'Turn 5 forgotten screenshots into missions.',
    icon: 'screenshot',
  },
  {
    key: 'comeback',
    label: 'Comeback Kid',
    description: 'Finish a mission from Recovery Mode.',
    icon: 'failed',
  },
];

export function demoAchievements(seed: number): DemoAchievement[] {
  const rng = makeRng(seed + 606);
  const now = Date.now();
  return achievementCatalog.map((achievement, index) => {
    const unlocked = index === 0 || rng() < 0.6;
    return {
      ...achievement,
      unlocked,
      unlockedAt: unlocked ? new Date(now - int(rng, 1, 40) * 24 * HOUR).toISOString() : null,
    };
  });
}

/** Time-blocked missions for the Day Timeline: 4-5 non-overlapping blocks across `day`. */
export function demoMissionsForDay(seed: number, day: Date, userId = 'demo-user'): Mission[] {
  const rng = makeRng(seed + day.getDate() * 7 + 707);
  const blocks = int(rng, 4, 5);
  const source = shuffled(rng, templates);
  let hour = int(rng, 6, 8);
  const result: Mission[] = [];
  for (let i = 0; i < blocks && hour < 21; i++) {
    const base = buildMission(
      rng,
      userId,
      i,
      source[i]!,
      i < 2 && day < new Date() ? 'completed' : 'active',
      Date.now(),
    );
    const start = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hour,
      rng() < 0.5 ? 0 : 30,
    );
    const end = new Date(start.getTime() + int(rng, 1, 3) * 30 * 60 * 1000 + 30 * 60 * 1000);
    result.push({
      ...base,
      id: `demo-day-${day.getDate()}-${i}`,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    });
    hour = end.getHours() + 1;
  }
  return result;
}
