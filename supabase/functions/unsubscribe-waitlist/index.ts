// Supabase Edge Function (Deno runtime) — unsubscribes a waitlist address (TODO.md Phase 18).
// Called by unsubscribe.html with the token from a newsletter's footer link. Real CAN-SPAM/GDPR
// requirement for commercial email, not optional scope: every newsletter must carry a working
// one-click unsubscribe.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server misconfigured: missing Supabase service credentials' }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.token) return json({ error: 'token is required' }, 400);

  const { error } = await supabase
    .from('waitlist_signups')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('confirmation_token', body.token)
    .is('unsubscribed_at', null);

  if (error) {
    console.error('Failed to unsubscribe:', error.message);
    return json({ error: 'Could not process your request. Please try again.' }, 500);
  }

  return json({ success: true }, 200);
});
