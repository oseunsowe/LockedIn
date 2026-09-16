-- Waitlist signups for lockedinmissions.app (the pre-launch marketing site, TODO.md Phase 18) —
-- a deliberate, narrow exception to this schema's otherwise-universal "every write requires a
-- real authenticated user" rule. A waitlist signup is inherently an anonymous, pre-account action;
-- there is no user to attach it to yet.
create type public.waitlist_platform as enum ('ios', 'android', 'both');

create table public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  platform_interest public.waitlist_platform,
  source text not null default 'lockedinmissions.app',
  created_at timestamptz not null default now()
);

alter table public.waitlist_signups enable row level security;

-- Exactly one policy: anonymous insert. Deliberately NO select policy for anyone but
-- service_role/the dashboard — the anon (publishable) key embedded in the public marketing page
-- can add an email but can never read the list back out, so a scraped page source can't leak it.
create policy "waitlist_signups_insert_anon" on public.waitlist_signups
  for insert to anon
  with check (true);

-- The unique constraint on `email` is the spam mitigation: a repeat submission of the same
-- address is a harmless no-op (the client should treat a unique_violation as a success state,
-- not an error — "you're already on the list" reads the same to the user as "you're on the list").
