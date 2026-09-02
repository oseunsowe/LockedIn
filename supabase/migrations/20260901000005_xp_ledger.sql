-- Append-only XP ledger. TODO.md §4.2: "Never mutate a running XP total — you will get drift,
-- and drift in a progression system destroys user trust permanently. Level and total are
-- derived." This table is the source of truth; profiles.xp_total is a cache, not a duplicate
-- source, kept in sync transactionally by the trigger below and always re-derivable by summing
-- this table if it's ever suspected to have drifted.
create table public.xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null,
  reason text not null,
  mission_id uuid references public.missions (id) on delete set null,
  created_at timestamptz not null default now()
);

create index xp_events_user_id_idx on public.xp_events (user_id, created_at);

alter table public.xp_events enable row level security;

create policy "xp_events_select_own" on public.xp_events
  for select using (auth.uid() = user_id);

-- No insert policy for authenticated users: XP is awarded server-side only, after AI
-- verification succeeds (TODO.md §9) — never self-reported by the client.

create or replace function public.apply_xp_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set xp_total = xp_total + new.amount
  where id = new.user_id;
  return new;
end;
$$;

create trigger xp_events_apply_on_insert
  after insert on public.xp_events
  for each row execute function public.apply_xp_event();

-- Deliberately no level-from-xp function yet: the XP curve and level thresholds are real
-- game-design work not yet done (TODO.md Phase 9 P0: "tune the early curve so levels 1-5 come
-- fast... and later levels earn meaning"). `profiles.level` stays a plain column, defaulting to
-- 1, until that curve is designed — do not invent threshold numbers here to fill the gap.
