import { defaultXpForDifficulty, maxXpForDifficulty } from '../xpCaps';

// This project has no Node type definitions (it's an RN app); declare only what this test uses.
declare const __dirname: string;
declare function require(id: 'fs'): { readFileSync(path: string, encoding: 'utf8'): string };
declare function require(id: 'path'): { join(...parts: string[]): string };
const { readFileSync } = require('fs');
const { join } = require('path');

function readCapMap(): Record<string, number> {
  const source = readFileSync(
    join(__dirname, '../../../../supabase/functions/verify-proof/index.ts'),
    'utf8',
  );
  const block = /const XP_CAP_BY_DIFFICULTY[^=]*=\s*\{([^}]*)\}/.exec(source);
  if (!block) throw new Error('XP_CAP_BY_DIFFICULTY not found in verify-proof');
  const entries = [...(block[1] ?? '').matchAll(/(\w+):\s*(\d+)/g)];
  return Object.fromEntries(entries.map((m) => [m[1] as string, Number(m[2])]));
}

describe('XP caps', () => {
  it('match the ceiling verify-proof enforces server-side', () => {
    expect(maxXpForDifficulty).toEqual(readCapMap());
  });

  it('never fall below the default reward, and stay within the database hard cap', () => {
    for (const [difficulty, cap] of Object.entries(maxXpForDifficulty)) {
      expect(cap).toBeGreaterThanOrEqual(
        defaultXpForDifficulty[difficulty as keyof typeof defaultXpForDifficulty],
      );
      expect(cap).toBeLessThanOrEqual(1500); // missions_xp_reward_cap in the migration
    }
  });
});
