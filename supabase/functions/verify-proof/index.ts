// Supabase Edge Function (Deno runtime) — the ONLY place the Anthropic API key exists
// (TODO.md §8.1: "The Anthropic API key never ships in the app bundle... All Claude calls go
// through your own server function"). Deployed with `supabase functions deploy verify-proof`;
// the key itself is set as a function secret (`supabase secrets set ANTHROPIC_API_KEY=...`), never
// committed here or anywhere in `app/`.
//
// Not deployed or run against a live Anthropic/Supabase project in this environment — there is no
// Deno runtime or Supabase CLI available here to execute it. Written and reviewed by hand against
// the documented Supabase Edge Function conventions and the Anthropic TypeScript SDK's documented
// API surface (see the `claude-api` skill), the same "can't run it, so be extra careful reading
// the real interfaces" discipline the rest of this backend was built under (see the migrations'
// own "not run against a live database" notes).

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.123.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.123.0/helpers/zod';
import { z } from 'npm:zod@4.5.4';

const DAILY_VERIFICATION_LIMIT = 20;
const SIGNED_URL_TTL_SECONDS = 300;
const IMAGE_PROOF_TYPES = new Set(['photo', 'screenshot']);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VerdictSchema = z.object({
  verified: z.boolean(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
  suggestedXp: z.number().int().min(0),
});
type Verdict = z.infer<typeof VerdictSchema>;

/**
 * Cached verbatim on every call (`cache_control: { type: 'ephemeral' }` below) — identical prefix
 * every time is what makes prompt caching pay off (TODO.md §8.3: "~90% off the input cost of the
 * largest part of the request"). Per §9's "no shame" rule and §8.3's "design the rejection path as
 * carefully as the success path," the rubric explicitly asks for a generous, benefit-of-the-doubt
 * read rather than an adversarial one — this is advisory verification, not fraud detection.
 */
const SYSTEM_PROMPT = `You are LockedIn's mission-proof reviewer. A user submitted a photo or screenshot as proof they completed a self-assigned personal-growth mission. You will judge whether the image plausibly supports the mission being done.

Be generous, not adversarial: this is advisory verification for a personal accountability app, not fraud detection. If the image is genuinely ambiguous, prefer a moderate confidence score and a clear, kind explanation over an outright rejection — the user should never feel accused or shamed. A low-confidence result routes the user to a friendly "tell us more" resubmit flow, never a bare failure screen, so it is safe to be honest about uncertainty rather than forcing a binary call.

Respond with:
- verified: true only if the image plausibly demonstrates the described mission was completed
- confidence: 0-100, your genuine confidence in that judgment
- reasoning: one or two sentences, written to the user directly, warm and specific to what you saw
- suggestedXp: the XP to award if verified (use the mission's stated reward as the default; you may reduce it — never invent a higher number — if the evidence only partially supports the mission), or 0 if not verified`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function recordVerification(
  supabase: ReturnType<typeof createClient>,
  proofId: string,
  verdict: Verdict,
): Promise<void> {
  const { error } = await supabase.from('verifications').insert({
    proof_id: proofId,
    verified: verdict.verified,
    confidence: verdict.confidence,
    reasoning: verdict.reasoning,
    suggested_xp: verdict.suggestedXp,
  });
  if (error) {
    // Logged, not thrown: the client already has the verdict to show, and a logging failure here
    // shouldn't turn a successful (or gracefully-handled) verification into a 500 for the user.
    console.error('Failed to record verification:', error.message);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server misconfigured: missing Supabase service credentials' }, 500);
  }
  if (!anthropicApiKey) {
    return json({ error: 'Server misconfigured: missing ANTHROPIC_API_KEY secret' }, 500);
  }

  // service_role bypasses RLS entirely — every ownership check below is done explicitly in code,
  // not delegated to Postgres policies, because none apply to this client.
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }
  const userId = userData.user.id;

  let body: { proofId?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.proofId) {
    return json({ error: 'proofId is required' }, 400);
  }

  const { data: proof, error: proofError } = await supabase
    .from('proofs')
    .select('id, user_id, type, storage_path, mission_id, missions(id, title, type, difficulty, xp_reward)')
    .eq('id', body.proofId)
    .single();

  if (proofError || !proof) {
    return json({ error: 'Proof not found' }, 404);
  }
  if (proof.user_id !== userId) {
    return json({ error: 'Forbidden' }, 403);
  }
  const mission = Array.isArray(proof.missions) ? proof.missions[0] : proof.missions;
  if (!mission) {
    return json({ error: 'Mission not found for this proof' }, 404);
  }

  if (!IMAGE_PROOF_TYPES.has(proof.type as string)) {
    // Voice/file proofs aren't sent to Claude in this build — there's no audio input on the
    // Messages API, and arbitrary file types aren't fetched. This is a real, honest fallback
    // outcome, not a fabricated AI verdict: it's returned without ever calling Claude, and
    // deliberately doesn't touch the AI quota below — it never reaches the paid call that quota
    // is bounding.
    const fallback: Verdict = {
      verified: false,
      confidence: 0,
      reasoning:
        'This proof type needs manual review — automatic verification currently only supports photo and screenshot proof.',
      suggestedXp: 0,
    };
    await recordVerification(supabase, proof.id, fallback);
    return json(fallback, 200);
  }

  // §8.1: server-side quota per user per day, checked (and consumed) immediately before the paid
  // Claude call — even a failed/erroring attempt below still counts, which is deliberate: it's
  // what stops a retry storm from a compromised or buggy client from costing more than the quota
  // allows.
  const { data: usageCount, error: usageError } = await supabase.rpc(
    'increment_ai_verification_usage',
    { p_user_id: userId },
  );
  if (usageError) {
    console.error('Quota check failed:', usageError.message);
    return json({ error: 'Could not check verification quota' }, 500);
  }
  if ((usageCount as number) > DAILY_VERIFICATION_LIMIT) {
    return json({ error: 'Daily verification limit reached. Try again tomorrow.' }, 429);
  }

  // §8.1: signed, expiring URL — the `proofs` bucket is private; this is the only way Claude (or
  // anyone) can read the object, and only for the next few minutes.
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('proofs')
    .createSignedUrl(proof.storage_path, SIGNED_URL_TTL_SECONDS);
  if (signedUrlError || !signedUrlData) {
    console.error('Signed URL creation failed:', signedUrlError?.message);
    return json({ error: 'Could not access proof media' }, 500);
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  let response;
  try {
    response = await anthropic.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(VerdictSchema),
      },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'url', url: signedUrlData.signedUrl } },
            {
              type: 'text',
              text: `Mission: "${mission.title}"\nMission type: ${mission.type}\nDifficulty: ${mission.difficulty}\nStated reward: ${mission.xp_reward} XP\n\nDoes this proof plausibly demonstrate the mission was completed?`,
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.error('Claude verification call failed:', err);
    return json({ error: 'Verification service is temporarily unavailable. Please try again.' }, 502);
  }

  // §8.3: "Handle stop_reason: 'refusal' before reading content — a user could submit anything as
  // proof." A refusal here is not a rejection of the mission, just of the content — same
  // no-shame, resubmit-friendly framing as a genuine low-confidence result.
  if (response.stop_reason === 'refusal') {
    const refusal: Verdict = {
      verified: false,
      confidence: 0,
      reasoning: "This proof couldn't be reviewed automatically. Try a different photo, or resubmit.",
      suggestedXp: 0,
    };
    await recordVerification(supabase, proof.id, refusal);
    return json(refusal, 200);
  }

  const verdict = response.parsed_output;
  if (!verdict) {
    return json({ error: 'Verification produced no usable result. Please try again.' }, 502);
  }

  await recordVerification(supabase, proof.id, verdict);

  if (verdict.verified) {
    const xpAmount = verdict.suggestedXp > 0 ? verdict.suggestedXp : mission.xp_reward;
    // Writes to `xp_events` (append-only ledger — 20260901000005_xp_ledger.sql's trigger keeps
    // `profiles.xp_total` in sync) and flips the mission to `completed`. A rejected/low-confidence
    // verdict deliberately does NOT flip the mission to `failed` — it stays `active` so the user
    // can resubmit (§8.3/§9's "no shame," "generous resubmit path").
    const { error: xpError } = await supabase.from('xp_events').insert({
      user_id: userId,
      amount: xpAmount,
      reason: 'mission_verified',
      mission_id: mission.id,
    });
    if (xpError) console.error('Failed to write xp_event:', xpError.message);

    const { error: missionError } = await supabase
      .from('missions')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', mission.id);
    if (missionError) console.error('Failed to mark mission completed:', missionError.message);

    // TODO.md §9: timezone-correct streak, with a one-day grace — see
    // record_mission_completion_streak() in 20260901000010_streaks.sql for the actual day-boundary
    // and grace logic. A failure here shouldn't fail the whole verification response — the user
    // already has their verdict and XP; a missed streak update just means it self-corrects on
    // their next verified mission.
    const { error: streakError } = await supabase.rpc('record_mission_completion_streak', {
      p_user_id: userId,
    });
    if (streakError) console.error('Failed to update streak:', streakError.message);

    // TODO.md §9 P1: server-evaluated achievement rules — see
    // evaluate_and_award_achievements() in 20260904000001_achievement_engine.sql. Same
    // "shouldn't fail the whole verification response" reasoning as the streak update above.
    const { error: achievementError } = await supabase.rpc('evaluate_and_award_achievements', {
      p_user_id: userId,
    });
    if (achievementError) console.error('Failed to evaluate achievements:', achievementError.message);
  }

  return json(verdict, 200);
});
