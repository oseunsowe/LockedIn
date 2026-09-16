// Supabase Edge Function (Deno runtime) — real account deletion.
//
// App Store Review Guideline 5.1.1(v): any app that lets a user create an account must also let
// them delete it, in-app, not just by emailing support. That's the actual reason this exists, not
// a nice-to-have — TODO.md's Phase 16 launch checklist has nothing to say about this specifically,
// but it is a real, non-negotiable App Review blocker discovered while getting the app ready to
// ship (`profile.tsx`).
//
// A user can't delete their own `auth.users` row with the anon/publishable key — that's a
// privileged operation (`auth.admin.deleteUser`), same reason `verify-proof` needs service_role.
// Every app table's `user_id` FK is `on delete cascade` back to `profiles`, which itself cascades
// from `auth.users` (see `20260901000001_profiles.sql`) — deleting the auth user is enough to wipe
// missions/proofs/verifications/xp_events/user_achievements/user_campaigns/ai_verification_usage/
// subscriptions in one step, confirmed by reading every migration's FK definitions, not assumed.
// The one thing a cascade can't reach is Storage — proof media in the `proofs` bucket is deleted
// explicitly below, before the account itself goes.

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

  // Best-effort: a failed storage cleanup shouldn't block the account deletion the user actually
  // asked for. Flat `{userId}/{file}` layout (see `src/lib/proofUpload.ts`) — one list call away.
  const { data: files, error: listError } = await supabase.storage.from('proofs').list(userId);
  if (listError) {
    console.error('Failed to list proof media for deletion:', listError.message);
  } else if (files && files.length > 0) {
    const paths = files.map((file) => `${userId}/${file.name}`);
    const { error: removeError } = await supabase.storage.from('proofs').remove(paths);
    if (removeError) console.error('Failed to remove proof media:', removeError.message);
  }

  const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('Failed to delete user:', deleteError.message);
    return json({ error: 'Could not delete account. Please try again.' }, 500);
  }

  return json({ success: true }, 200);
});
