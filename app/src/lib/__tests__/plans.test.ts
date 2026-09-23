import {
  TRIAL_ELIGIBLE_PERIODS,
  formatUsd,
  plans,
  productId,
  yearlySavingsPercent,
} from '../plans';

// This project has no Node type definitions (it's an RN app); declare only what this test uses.
declare const __dirname: string;
declare function require(id: 'fs'): { readFileSync(path: string, encoding: 'utf8'): string };
declare function require(id: 'path'): { join(...parts: string[]): string };
const { readFileSync } = require('fs');
const { join } = require('path');

const functionsDir = join(__dirname, '../../../../supabase/functions');

/** Reads a `Record<SubscriptionTier, number>` literal like `const NAME = { free: 5, pro: 20, ... }`
 * out of an Edge Function's source, so the paywall can't quietly drift from what's enforced. */
function readLimitMap(file: string, name: string): Record<string, number> {
  const source = readFileSync(join(functionsDir, file), 'utf8');
  const block = new RegExp(`const ${name}[^=]*=\\s*\\{([^}]*)\\}`).exec(source);
  if (!block) throw new Error(`${name} not found in ${file}`);
  const entries = [...(block[1] ?? '').matchAll(/(\w+):\s*(\d+)/g)];
  return Object.fromEntries(entries.map((m) => [m[1] as string, Number(m[2])]));
}

describe('plans', () => {
  it('offers free, pro, and elite in order', () => {
    expect(plans.map((p) => p.key)).toEqual(['free', 'pro', 'elite']);
  });

  it('matches the daily verification limits enforced by verify-proof', () => {
    const enforced = readLimitMap('verify-proof/index.ts', 'DAILY_VERIFICATION_LIMIT');
    for (const plan of plans) expect(plan.verificationsPerDay).toBe(enforced[plan.key]);
  });

  it('matches the daily scan limits enforced by scan-screenshots', () => {
    const enforced = readLimitMap('scan-screenshots/index.ts', 'DAILY_SCAN_LIMIT');
    for (const plan of plans) expect(plan.scansPerDay).toBe(enforced[plan.key]);
  });

  it('gives each higher tier strictly higher limits and price', () => {
    for (let i = 1; i < plans.length; i++) {
      const [lower, higher] = [plans[i - 1]!, plans[i]!];
      expect(higher.verificationsPerDay).toBeGreaterThan(lower.verificationsPerDay);
      expect(higher.scansPerDay).toBeGreaterThan(lower.scansPerDay);
    }
    const [, pro, elite] = plans;
    expect(elite!.priceUsd!.monthly).toBeGreaterThan(pro!.priceUsd!.monthly);
    expect(elite!.priceUsd!.yearly).toBeGreaterThan(pro!.priceUsd!.yearly);
  });

  it('has no price on the free plan and a cheaper-than-monthly yearly price on paid plans', () => {
    expect(plans[0]!.priceUsd).toBeNull();
    for (const plan of plans.slice(1)) {
      expect(plan.priceUsd!.yearly).toBeLessThan(plan.priceUsd!.monthly * 12);
    }
  });

  it('prices every period on paid plans, cheapest to most expensive as the commitment lengthens', () => {
    for (const plan of plans.slice(1)) {
      const p = plan.priceUsd!;
      expect(p.daily).toBeLessThan(p.weekly);
      expect(p.weekly).toBeLessThan(p.monthly);
      expect(p.monthly).toBeLessThan(p.yearly);
    }
  });

  it('only offers a trial on periods at least as long as the trial itself', () => {
    expect(TRIAL_ELIGIBLE_PERIODS).not.toContain('daily');
    expect(TRIAL_ELIGIBLE_PERIODS).not.toContain('weekly');
    expect(TRIAL_ELIGIBLE_PERIODS).toContain('monthly');
    expect(TRIAL_ELIGIBLE_PERIODS).toContain('yearly');
  });
});

describe('pricing helpers', () => {
  it('builds product ids the webhook can map back to a tier', () => {
    expect(productId('pro', 'monthly')).toBe('lockedin_pro_monthly');
    expect(productId('elite', 'yearly')).toBe('lockedin_elite_yearly');
    expect(productId('pro', 'daily')).toBe('lockedin_pro_daily');
    expect(productId('elite', 'weekly')).toBe('lockedin_elite_weekly');
  });

  it('formats prices to two decimals', () => {
    expect(formatUsd(4.99)).toBe('$4.99');
    expect(formatUsd(40)).toBe('$40.00');
  });

  it('computes the yearly savings percentage', () => {
    expect(yearlySavingsPercent({ monthly: 5, yearly: 40 })).toBe(33);
    expect(yearlySavingsPercent({ monthly: 10, yearly: 120 })).toBe(0);
  });
});
