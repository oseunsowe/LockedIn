-- Per-user, per-day AI verification quota (TODO.md §8.1: "server-side quota per user per day. A
-- compromised client should cost you dollars, not thousands."). Written and read only by the
-- verify-proof Edge Function via service_role — no RLS policy grants the authenticated role
-- access at all, the same "server-only table" pattern as xp_events/verifications.
create table public.ai_verification_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  usage_date date not null default current_date,
  verification_count integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.ai_verification_usage enable row level security;
-- Deliberately zero policies: only service_role (which bypasses RLS) ever touches this table.

-- Atomic increment-and-read, called once per verification attempt before the Claude call. A
-- plain "select then insert-or-update" from the Edge Function would race under concurrent
-- requests from the same user (two proofs submitted back-to-back); this makes the check-and-
-- increment a single round trip.
create or replace function public.increment_ai_verification_usage(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_verification_usage (user_id, usage_date, verification_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, usage_date)
  do update set verification_count = public.ai_verification_usage.verification_count + 1
  returning verification_count into new_count;

  return new_count;
end;
$$;

-- No grant to `authenticated`/`anon`: only service_role (which ignores grants) calls this. If a
-- client ever called it directly it would just inflate its own quota faster, not anyone else's —
-- but it should only ever be invoked from the Edge Function, not the app.
revoke all on function public.increment_ai_verification_usage(uuid) from public, anon, authenticated;
