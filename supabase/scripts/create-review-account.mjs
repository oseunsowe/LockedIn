// Creates (or resets) a seeded demo account for Google Play / App Store review and prints its login.
//
//   SUPABASE_SECRET_KEY=sb_secret_... node supabase/scripts/create-review-account.mjs [email]
//
// Uses the project's SECRET (service-role) key, so run it only from a trusted machine; the key is
// read from the environment and never written anywhere. Safe to re-run: it deletes and recreates the
// account each time, so the printed password is always current. Every value it writes goes through the
// same tables/triggers the real app uses (xp_events -> level, evaluate_and_award_achievements).
const URL = 'https://usqukqpgwexwjiglhpdj.supabase.co';
const PUBLISHABLE = 'sb_publishable_prtebrryT7htgxbglRYNgA_nxDZM3-k';
const secret = process.env.SUPABASE_SECRET_KEY;
if (!secret) throw new Error('Set SUPABASE_SECRET_KEY');
const email = (process.argv[2] ?? 'playreview@lockedinmission.app').toLowerCase();

const admin = { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };
async function call(method, path, body, extra = {}) {
  const res = await fetch(`${URL}${path}`, { method, headers: { ...admin, ...extra }, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return json;
}

// 1. Remove any existing account with this email (cascades through every user table).
const list = await call('GET', `/auth/v1/admin/users?per_page=200`);
const existing = (list.users ?? []).find((u) => u.email?.toLowerCase() === email);
if (existing) await call('DELETE', `/auth/v1/admin/users/${existing.id}`);

// 2. Create a confirmed user with a strong random password.
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
const bytes = crypto.getRandomValues(new Uint8Array(18));
const password = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('') + '#7';
const created = await call('POST', '/auth/v1/admin/users', {
  email,
  password,
  email_confirm: true,
  user_metadata: { display_name: 'Alex' },
});
const userId = created.id;

// 3. Profile: mark onboarding complete so the reviewer lands on Home.
const today = new Date();
const dateKey = today.toISOString().slice(0, 10);
await call('PATCH', `/rest/v1/profiles?id=eq.${userId}`, {
  display_name: 'Alex',
  identity_class: 'developer',
  timezone: 'UTC',
  onboarding_completed_at: new Date().toISOString(),
}, { Prefer: 'return=minimal' });

// 4. Seeded history: 14 consecutive days of verified missions.
const pool = [
  ['Ship the landing page', 'main', 'buildBusiness', 'screenshot'], ['Morning workout', 'daily', 'improveFitness', 'photo'],
  ['Read for 30 minutes', 'daily', 'personalGrowth', 'photo'], ['Refactor the auth module', 'side', 'careerGrowth', 'screenshot'],
  ['Write 800 words', 'side', 'createContent', 'file'], ['Review monthly budget', 'side', 'increaseIncome', 'file'],
  ['Practice Spanish - 20 min', 'side', 'learnSkill', 'photo'], ['Deep work block - 90 min', 'side', 'careerGrowth', 'screenshot'],
];
const diffs = [['standard', 100], ['standard', 100], ['challenging', 250], ['hard', 500]];
const reasons = ['Clear evidence of the finished work. Nicely done.', 'The proof shows real, specific progress on this goal.', 'Everything the mission asked for is visible here.'];
let seed = 7;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const missions = [], proofs = [], verifications = [], xpEvents = [];
const { randomUUID } = await import('node:crypto');
for (let d = 0; d < 14; d++) {
  const count = 1 + Math.floor(rnd() * 3);
  for (let k = 0; k < count; k++) {
    const [title, type, campaign, proofType] = pick(pool);
    const [difficulty, xp] = pick(diffs);
    const completed = new Date(Date.now() - d * 86400000 - (2 + Math.floor(rnd() * 8)) * 3600000);
    if (completed > new Date(Date.now() - 600000)) completed.setTime(Date.now() - 900000 - k * 60000);
    const created = new Date(completed.getTime() - 4 * 3600000);
    const missionId = randomUUID(), proofId = randomUUID();
    missions.push({ id: missionId, user_id: userId, campaign_key: campaign, type, title, difficulty, status: 'completed', xp_reward: xp, proof_requirements: [{ type: proofType }], deadline: new Date(completed.getTime() + 7200000).toISOString(), created_at: created.toISOString(), completed_at: completed.toISOString() });
    proofs.push({ id: proofId, mission_id: missionId, user_id: userId, type: proofType, storage_path: `review-seed/${missionId}`, submitted_at: new Date(completed.getTime() - 240000).toISOString() });
    verifications.push({ proof_id: proofId, verified: true, confidence: 88 + Math.floor(rnd() * 11), reasoning: pick(reasons), suggested_xp: xp, created_at: completed.toISOString() });
    xpEvents.push({ user_id: userId, amount: xp, reason: 'mission_verified', mission_id: missionId, created_at: completed.toISOString() });
  }
}
const hours = (h) => new Date(Date.now() + h * 3600000).toISOString();
const active = [
  ['Ship the landing page', 'main', 'buildBusiness', 'hard', 500, 'screenshot', 30],
  ['Refactor the auth module', 'side', 'careerGrowth', 'challenging', 250, 'screenshot', 20],
  ['Morning workout', 'daily', 'improveFitness', 'standard', 100, 'photo', 12],
  ['Read for 30 minutes', 'daily', 'personalGrowth', 'standard', 100, 'photo', 18],
].map(([title, type, campaign_key, difficulty, xp_reward, p, h]) => ({ user_id: userId, campaign_key, type, title, difficulty, status: 'active', xp_reward, proof_requirements: [{ type: p }], deadline: hours(h) }));

const ins = (table, rows) => call('POST', `/rest/v1/${table}`, rows, { Prefer: 'return=minimal' });
await ins('missions', missions);
await ins('proofs', proofs);
await ins('verifications', verifications);
await ins('missions', active);
await ins('xp_events', xpEvents); // trigger applies XP and derives the level

await call('PATCH', `/rest/v1/profiles?id=eq.${userId}`, { streak_count: 14, last_streak_date: dateKey }, { Prefer: 'return=minimal' });
await call('POST', '/rest/v1/rpc/evaluate_and_award_achievements', { p_user_id: userId });

// 5. Prove the login works exactly as the app does it (publishable key + password grant).
const login = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { apikey: PUBLISHABLE, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
const session = await login.json();
if (!login.ok) throw new Error('Login check failed: ' + JSON.stringify(session).slice(0, 200));
const profile = await (await fetch(`${URL}/rest/v1/profiles?select=display_name,level,xp_total,streak_count&id=eq.${userId}`, { headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${session.access_token}` } })).json();

console.log(JSON.stringify({ email, password, userId, seeded: { completedMissions: missions.length, activeMissions: active.length }, profileAsSeenByApp: profile[0] }, null, 2));
