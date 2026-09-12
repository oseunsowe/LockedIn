-- Double opt-in for the waitlist (TODO.md Phase 18) — decided over a bare welcome notice
-- specifically because lockedinmission.app is a brand-new sending domain; unconfirmed cold sends
-- risk landing in spam and damaging deliverability before the app has even launched.
--
-- A row counts as an active newsletter subscriber only when
-- `confirmed_at is not null and unsubscribed_at is null` — send-newsletter filters on exactly
-- that condition.
alter table public.waitlist_signups
  add column confirmation_token uuid not null default gen_random_uuid(),
  add column confirmed_at timestamptz,
  add column unsubscribed_at timestamptz;

-- Confirmation/unsubscribe links carry this token — needs to be looked up directly (not just
-- filtered) by confirm-waitlist/unsubscribe-waitlist, both service_role Edge Functions.
create unique index waitlist_signups_confirmation_token_idx
  on public.waitlist_signups (confirmation_token);

-- A record of every newsletter actually sent — so the dashboard has real history instead of being
-- a black box. Written only by the send-newsletter Edge Function (service_role); no RLS grant to
-- authenticated/anon at all, same "server-only table" pattern as xp_events/verifications.
create table public.newsletter_sends (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  sent_by uuid not null references public.profiles (id),
  recipient_count integer not null,
  created_at timestamptz not null default now()
);

alter table public.newsletter_sends enable row level security;
-- Deliberately zero policies: only service_role touches this table directly. The dashboard reads
-- send history through a dedicated function call (not a direct table select) so the admin check
-- happens every time, not just at login.
