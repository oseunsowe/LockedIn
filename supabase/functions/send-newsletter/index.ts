// Supabase Edge Function (Deno runtime) — the newsletter dashboard's core action
// (TODO.md Phase 18). Requires a real authenticated Supabase session AND membership in the
// `admins` allowlist table — authentication alone isn't authorization; a non-admin logged-in
// user is rejected here, not just hidden by the dashboard's UI.
//
// GET returns recent send history (for the dashboard's "recent sends" list); POST sends a real
// newsletter to every confirmed, non-unsubscribed address. Sequential sends within one
// invocation — fine at current list size. If the list grows into the thousands this needs
// batching/a queue instead; not built now, flagged honestly in TODO.md.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { sendMail } from '../_shared/email.ts';
import { newsletterEmail } from '../_shared/emailTemplates.ts';

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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'Server misconfigured: missing Supabase service credentials' }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  const { data: userData, error: userError } = await supabase.auth.getUser(jwt);
  if (userError || !userData.user) {
    return json({ error: 'Invalid or expired session' }, 401);
  }
  const userId = userData.user.id;

  const { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (adminError) {
    console.error('Admin check failed:', adminError.message);
    return json({ error: 'Could not verify admin status' }, 500);
  }
  if (!admin) {
    return json({ error: 'Forbidden' }, 403);
  }

  if (req.method === 'GET') {
    const [sendsResult, countResult] = await Promise.all([
      supabase
        .from('newsletter_sends')
        .select('id, subject, recipient_count, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('waitlist_signups')
        .select('id', { count: 'exact', head: true })
        .not('confirmed_at', 'is', null)
        .is('unsubscribed_at', null),
    ]);
    if (sendsResult.error) return json({ error: sendsResult.error.message }, 500);
    return json(
      { sends: sendsResult.data, confirmedSubscriberCount: countResult.count ?? 0 },
      200,
    );
  }

  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body: { subject?: string; bodyHtml?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!body.subject || !body.bodyHtml) {
    return json({ error: 'subject and bodyHtml are required' }, 400);
  }

  const { data: recipients, error: recipientsError } = await supabase
    .from('waitlist_signups')
    .select('email, confirmation_token')
    .not('confirmed_at', 'is', null)
    .is('unsubscribed_at', null);
  if (recipientsError) {
    return json({ error: 'Could not load subscribers' }, 500);
  }
  if (!recipients || recipients.length === 0) {
    return json({ error: 'No confirmed subscribers to send to' }, 400);
  }

  let sentCount = 0;
  for (const recipient of recipients) {
    const unsubscribeUrl = `https://lockedinmission.app/unsubscribe.html?token=${recipient.confirmation_token}`;
    const { html } = newsletterEmail(body.subject, body.bodyHtml, unsubscribeUrl);
    try {
      await sendMail({ to: recipient.email, subject: body.subject, html });
      sentCount++;
    } catch (err) {
      // One bad address shouldn't abort the whole send — log and keep going.
      console.error(`Failed to send newsletter to ${recipient.email}:`, err);
    }
  }

  const { error: logError } = await supabase.from('newsletter_sends').insert({
    subject: body.subject,
    body_html: body.bodyHtml,
    sent_by: userId,
    recipient_count: sentCount,
  });
  if (logError) console.error('Failed to log newsletter send:', logError.message);

  return json({ success: true, recipientCount: sentCount }, 200);
});
