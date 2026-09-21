// Supabase Edge Function (Deno runtime) — the only writer of `subscriptions.tier/status` besides
// hand edits (TODO.md Phase 12). RevenueCat calls this on every purchase/renewal/cancellation/
// expiration; the tier-aware daily limits in verify-proof and scan-screenshots then pick the new
// tier up on the very next request, with no app update and no client trust involved.
//
// Not called by the app, so JWT verification is off for this function (supabase/config.toml).
// Authentication is instead a shared secret: set the same value as REVENUECAT_WEBHOOK_SECRET here
// and as the webhook's "Authorization header value" in the RevenueCat dashboard.
//
// Product naming convention (must match app/src/lib/plans.ts): `lockedin_<tier>_<period>`, e.g.
// `lockedin_pro_monthly`, `lockedin_elite_yearly`. The tier is read from the product id first and
// from the event's entitlement ids second.
//
// `app_user_id` must be the Supabase user id — the app has to call Purchases.logIn(user.id) once
// the RevenueCat SDK is added. Anonymous ids ($RCAnonymousID:...) are ignored, not errors.

import { createClient } from 'npm:@supabase/supabase-js@2';

type Tier = 'free' | 'pro' | 'elite';
type Status = 'active' | 'trialing' | 'canceled' | 'expired';

type RevenueCatEvent = {
  type?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  product_id?: string;
  new_product_id?: string;
  entitlement_ids?: string[] | null;
  period_type?: string;
  cancel_reason?: string;
  expiration_at_ms?: number | null;
  event_timestamp_ms?: number;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Events that leave the user entitled to the tier of the product involved.
const GRANT_EVENTS = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'PRODUCT_CHANGE',
  'UNCANCELLATION',
  'SUBSCRIPTION_EXTENDED',
]);

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Constant-time comparison so response timing can't leak how much of the secret matched. */
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  }
  return diff === 0;
}

function tierOf(productId: string | undefined, entitlementIds: string[] | null | undefined) {
  const haystacks = [productId ?? '', ...(entitlementIds ?? [])].map((s) => s.toLowerCase());
  // Check elite before pro so a name containing both can never resolve to the cheaper tier.
  for (const tier of ['elite', 'pro'] as const) {
    if (haystacks.some((s) => s.includes(tier))) return tier;
  }
  return null;
}

function iso(ms: number | null | undefined): string | null {
  return typeof ms === 'number' && Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  // Fail closed: with no secret configured, nobody is authorized — never fall back to "open".
  if (!secret || !supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server misconfigured' }, 500);
  }

  const provided = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  if (!safeEqual(provided, secret)) return json({ error: 'Unauthorized' }, 401);

  let event: RevenueCatEvent;
  try {
    event = (await req.json()).event;
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!event || typeof event.type !== 'string') {
    return json({ error: 'Missing event' }, 400);
  }

  // Everything below returns 2xx for events we deliberately don't act on — RevenueCat retries any
  // non-2xx, and retrying an event we'll never handle just fills its retry queue.
  if (event.type === 'TEST') return json({ ok: true, ignored: 'test event' }, 200);

  const userId = [event.app_user_id, event.original_app_user_id, ...(event.aliases ?? [])].find(
    (id): id is string => typeof id === 'string' && UUID_RE.test(id),
  );
  if (!userId) return json({ ok: true, ignored: 'no Supabase user id on event' }, 200);

  const eventAt = iso(event.event_timestamp_ms) ?? new Date().toISOString();
  let update: { tier: Tier; status: Status; current_period_end?: string | null };

  if (GRANT_EVENTS.has(event.type)) {
    const productId = event.type === 'PRODUCT_CHANGE' ? event.new_product_id : event.product_id;
    const tier = tierOf(productId, event.entitlement_ids);
    if (!tier) return json({ ok: true, ignored: 'unrecognized product' }, 200);
    update = {
      tier,
      status: event.period_type === 'TRIAL' ? 'trialing' : 'active',
      current_period_end: iso(event.expiration_at_ms),
    };
  } else if (event.type === 'EXPIRATION') {
    update = { tier: 'free', status: 'expired', current_period_end: iso(event.expiration_at_ms) };
  } else if (event.type === 'CANCELLATION' && event.cancel_reason === 'CUSTOMER_SUPPORT') {
    // A refund revokes access immediately. Any other cancellation just turns auto-renew off — the
    // user paid through the period, so they keep their tier until the EXPIRATION event arrives.
    update = { tier: 'free', status: 'canceled' };
  } else {
    return json({ ok: true, ignored: `no state change for ${event.type}` }, 200);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      ...update,
      revenuecat_app_user_id: event.app_user_id ?? null,
      last_event_at: eventAt,
    })
    .eq('user_id', userId)
    // Drop events older than what's already applied (webhooks can arrive out of order).
    .or(`last_event_at.is.null,last_event_at.lt.${eventAt}`)
    .select('user_id');

  if (error) {
    console.error('Failed to update subscription:', error.message);
    return json({ error: 'Could not update subscription' }, 500); // non-2xx so RevenueCat retries
  }
  if (!data || data.length === 0) {
    return json({ ok: true, applied: false, reason: 'unknown user or stale event' }, 200);
  }
  return json({ ok: true, applied: true, tier: update.tier, status: update.status }, 200);
});
