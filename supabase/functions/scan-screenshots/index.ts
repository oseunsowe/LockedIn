// Supabase Edge Function (Deno runtime) — Screenshot Intelligence extraction (TODO.md §10).
//
// The non-negotiable rule this function is built around (§10: "get this wrong once and the
// product is finished"): screenshots are among the most sensitive data on a phone, so raw image
// bytes are NEVER written to a table or a Storage bucket here. They arrive in the request body as
// base64, get forwarded to Claude for extraction, and are discarded the moment this function
// returns — only the AI's short text output (`extracted_intentions` rows) is persisted. Contrast
// with `verify-proof`, which legitimately needs the `proofs` Storage bucket because proof media
// *is* the evidence a user is submitting; there is no equivalent reason to retain a screenshot
// past the few seconds it takes to read it.
//
// Cost note: TODO.md §10 flags the Anthropic Batch API as "the single largest cost lever" for
// bulk scans, but the Batch API is asynchronous (its own SLA can run to hours), which doesn't fit
// this screen's "scanning animation covers the wait" UX without a working notification system to
// tell the user later — and push notifications (Phase 13) are blocked on the same Apple Developer
// Program enrollment as everything else native right now. This uses the synchronous Messages API
// instead: real, working results in seconds, at full (non-batch) per-token cost. Revisit once
// Phase 13 unblocks — the deferred 50% saving is a documented gap, not a hidden one.

import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@0.123.0';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk@0.123.0/helpers/zod';
import { z } from 'npm:zod@4.5.4';

// A hard batch cap (TODO.md §10: "batch size caps... never scan the whole library silently"),
// enforced server-side — a modified client can't send more images than this in one request no
// matter what the picker UI allows.
const MAX_BATCH_SIZE = 10;
const DAILY_SCAN_LIMIT = 60;

const CAMPAIGN_KEYS = [
  'careerGrowth',
  'buildBusiness',
  'learnSkill',
  'improveFitness',
  'increaseIncome',
  'createContent',
  'improveHealth',
  'personalGrowth',
] as const;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ExtractionSchema = z.object({
  intentions: z.array(
    z.object({
      sourceImageId: z.string(),
      intention: z.string(),
      category: z.enum(CAMPAIGN_KEYS),
      confidence: z.number().min(0).max(100),
    }),
  ),
});

/**
 * Unlike `verify-proof`'s generous rubric (advisory verification, err toward believing the user),
 * this one is asked to be precise, not generous — TODO.md's own gate is "≥10 genuine intentions,
 * ≤2 false positives" from 50 screenshots, i.e. optimize for not cluttering the results screen
 * with noise, not for finding something in every image.
 */
const SYSTEM_PROMPT = `You are LockedIn's Screenshot Intelligence extractor. The user has shared a batch of photo-library screenshots. For each one, decide whether it plausibly reveals a genuine personal-growth intention: a saved course or tutorial, a bookmarked article or book, a fitness or meal plan, a business or side-project idea, a saved job posting, a to-do or goal-tracking app screenshot, a motivational note — anything that suggests something the user wants to do or become.

Be precise, not generous: most screenshots (chats, memes, random photos, receipts) have no such intention — leave those out of your output entirely rather than stretching to find something. Only include an image if you're genuinely confident it reflects a real intention, and never invent detail beyond what's visibly in the image.

For each image you DO include:
- sourceImageId: copy the exact id given for that image
- intention: a short, specific, first-person-friendly phrase (e.g. "Learn watercolor painting", "Finish the React course you bookmarked") — not a generic label
- category: the single best-fit campaign from the given list
- confidence: 0-100, your genuine confidence this is a real intention and not a misread

Images with no genuine intention should simply be absent from your \`intentions\` array — do not include a "not found" placeholder entry for them.`;

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

type ImageInput = { id: string; base64: string; mediaType: string };

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

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }
  const userId = userData.user.id;

  let body: { images?: ImageInput[] };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const images = body.images ?? [];
  if (images.length === 0) {
    return json({ error: 'At least one image is required' }, 400);
  }
  if (images.length > MAX_BATCH_SIZE) {
    return json({ error: `Scan at most ${MAX_BATCH_SIZE} screenshots at a time.` }, 400);
  }

  // §8.1-style server-side quota, extended to §10: incremented by the whole batch size in one
  // atomic call, same reasoning as increment_ai_verification_usage — a compromised client
  // replaying scan requests should hit a hard daily cap, not an unbounded bill.
  const { data: usageCount, error: usageError } = await supabase.rpc(
    'increment_screenshot_scan_usage',
    { p_user_id: userId, p_count: images.length },
  );
  if (usageError) {
    console.error('Quota check failed:', usageError.message);
    return json({ error: 'Could not check scan quota' }, 500);
  }
  if ((usageCount as number) > DAILY_SCAN_LIMIT) {
    return json({ error: 'Daily screenshot scan limit reached. Try again tomorrow.' }, 429);
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  const imageBlocks = images.flatMap((image) => [
    { type: 'text' as const, text: `Image id: ${image.id}` },
    {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: image.mediaType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: image.base64,
      },
    },
  ]);

  let response;
  try {
    response = await anthropic.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'medium',
        format: zodOutputFormat(ExtractionSchema),
      },
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages: [
        {
          role: 'user',
          content: [
            ...imageBlocks,
            {
              type: 'text',
              text: 'Extract any genuine personal-growth intentions from the images above, per the rules in your instructions.',
            },
          ],
        },
      ],
    });
  } catch (err) {
    console.error('Claude extraction call failed:', err);
    return json(
      { error: 'Screenshot scanning is temporarily unavailable. Please try again.' },
      502,
    );
  }

  if (response.stop_reason === 'refusal') {
    // Same posture as verify-proof: a refusal means the content couldn't be reviewed, not that
    // the user did anything wrong. Return an empty result rather than an error — from the user's
    // side this just looks like "nothing found in this batch."
    return json({ intentions: [] }, 200);
  }

  const extraction = response.parsed_output;
  if (!extraction) {
    return json({ error: 'Screenshot scanning produced no usable result. Please try again.' }, 502);
  }

  if (extraction.intentions.length === 0) {
    return json({ intentions: [] }, 200);
  }

  const { data: inserted, error: insertError } = await supabase
    .from('extracted_intentions')
    .insert(
      extraction.intentions.map((item) => ({
        user_id: userId,
        intention: item.intention,
        category: item.category,
        confidence: item.confidence,
      })),
    )
    .select('id, intention, category, confidence');

  if (insertError) {
    console.error('Failed to persist extracted intentions:', insertError.message);
    return json({ error: 'Could not save scan results. Please try again.' }, 500);
  }

  return json({ intentions: inserted }, 200);
});
