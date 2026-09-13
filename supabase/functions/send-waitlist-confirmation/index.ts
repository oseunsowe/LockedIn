// Supabase Edge Function (Deno runtime) — sends the double opt-in confirmation email
// (TODO.md Phase 18). Called by the waitlist page's script.js immediately after a successful
// insert into waitlist_signups.
//
// Public, no auth required — but scoped, not an open mail relay: it only ever sends to an email
// that already has a pending row in waitlist_signups, looked up by service_role. A client can't
// use this to send arbitrary content to arbitrary addresses.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { sendMail } from '../_shared/email.ts';
import { confirmationEmail } from '../_shared/emailTemplates.ts';

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

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.email) return json({ error: 'email is required' }, 400);

  const { data: signup, error: lookupError } = await supabase
    .from('waitlist_signups')
    .select('email, confirmation_token, confirmed_at')
    .eq('email', body.email)
    .single();

  if (lookupError || !signup) {
    // Doesn't exist as a pending signup — nothing to confirm, and definitely not a channel to
    // email an arbitrary address. Return success-shaped so this never becomes an email-existence
    // oracle for a client probing addresses.
    return json({ success: true }, 200);
  }
  if (signup.confirmed_at) {
    return json({ success: true }, 200); // already confirmed, nothing to send
  }

  const confirmUrl = `https://lockedinmission.app/confirm.html?token=${signup.confirmation_token}`;
  const { subject, html } = confirmationEmail(confirmUrl);

  try {
    await sendMail({ to: signup.email, subject, html });
  } catch (err) {
    console.error('Failed to send confirmation email:', err);
    return json({ error: 'Could not send confirmation email' }, 502);
  }

  return json({ success: true }, 200);
});
