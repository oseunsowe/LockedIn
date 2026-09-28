-- Focus Mode sessions (TODO.md §7.3 / §11): the in-app immersive timer on Active Mission Mode was
-- previously never persisted, so no "focus" stat could exist. Each row is one finished session.
--
-- Deliberately self-reported and low-stakes: the client inserts its own rows (RLS below), the
-- duration is capped, and nothing here awards XP or feeds achievements/streaks - so a tampered
-- value can only inflate the user's own "focus time" display, never the XP ledger.
create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  mission_id uuid references public.missions (id) on delete set null,
  started_at timestamptz not null,
  duration_seconds integer not null check (duration_seconds >= 0 and duration_seconds <= 43200),
  created_at timestamptz not null default now()
);

create index focus_sessions_user_id_started_at_idx
  on public.focus_sessions (user_id, started_at desc);

alter table public.focus_sessions enable row level security;

create policy "focus_sessions_select_own" on public.focus_sessions
  for select using (auth.uid() = user_id);

create policy "focus_sessions_insert_own" on public.focus_sessions
  for insert with check (auth.uid() = user_id);

-- No update/delete policy: sessions are an append-only record; account deletion cascades.
