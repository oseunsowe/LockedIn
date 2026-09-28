import { generateMissionIdeas, missionTemplates } from '../missionTemplates';

describe('missionTemplates', () => {
  it('has unique ids and three templates per goal', () => {
    const ids = missionTemplates.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const perGoal = new Map<string, number>();
    for (const t of missionTemplates) perGoal.set(t.campaign, (perGoal.get(t.campaign) ?? 0) + 1);
    expect([...perGoal.values()].every((n) => n === 3)).toBe(true);
  });
});

describe('generateMissionIdeas', () => {
  const base = { identityClass: 'developer' as const, goals: [], hour: 9 };

  it('returns six ideas, at most two per goal', () => {
    const ideas = generateMissionIdeas({ ...base, seed: 1 });
    expect(ideas).toHaveLength(6);
    const perGoal = new Map<string, number>();
    for (const i of ideas) perGoal.set(i.campaign, (perGoal.get(i.campaign) ?? 0) + 1);
    expect(Math.max(...perGoal.values())).toBeLessThanOrEqual(2);
  });

  it('prioritises the user’s own goals', () => {
    const ideas = generateMissionIdeas({ ...base, goals: ['improveFitness'], seed: 3 });
    expect(ideas.filter((i) => i.campaign === 'improveFitness')).toHaveLength(2);
    expect(ideas[0]!.reason).toBe('Matches one of your goals');
  });

  it('is deterministic per seed and reshuffles with a new one', () => {
    const a = generateMissionIdeas({ ...base, seed: 5 }).map((i) => i.id);
    expect(generateMissionIdeas({ ...base, seed: 5 }).map((i) => i.id)).toEqual(a);
    expect(generateMissionIdeas({ ...base, seed: 6 }).map((i) => i.id)).not.toEqual(a);
  });
});
