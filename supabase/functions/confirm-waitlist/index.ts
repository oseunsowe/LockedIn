// Supabase Edge Function (Deno runtime) — confirms a waitlist double opt-in (TODO.md Phase 18).
// Called by confirm.html with the token from the confirmation email's link. Public, but a token
// is a real secret — an unguessable UUID — same trust model as every emailed confirmation link.

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

  const { data, error } = await supabase
    .from('waitlist_signups')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('confirmation_token', body.token)
    .is('confirmed_at', null)
    .select('email')
    .maybeSingle();

  if (error) {
    console.error('Failed to confirm waitlist signup:', error.message);
    return json({ error: 'Could not confirm your email. Please try again.' }, 500);
  }
  if (!data) {
    // Either the token doesn't exist, or it was already confirmed — both read the same to the
    // visitor: their email is (now, or already) confirmed.
    return json({ success: true, alreadyConfirmed: true }, 200);
  }

  return json({ success: true }, 200);
});
