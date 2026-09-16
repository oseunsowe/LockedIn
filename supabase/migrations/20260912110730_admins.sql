-- Newsletter dashboard admin allowlist (TODO.md Phase 18). A real Supabase Auth login is required
-- to reach the dashboard at all, but authentication alone isn't authorization — this table is the
-- actual gate `send-newsletter` checks before doing anything. Same "server-only unless it's your
-- own row" pattern as everything else in this schema.
create table public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- A signed-in user may check whether THEY are an admin (the dashboard's own login-gate query) —
-- this leaks nothing about who else is an admin, only ever your own row or nothing.
create policy "admins_select_own" on public.admins
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated/anon: the first (and so far only) admin row is
-- added once, directly, via service_role during setup — not through any client-reachable path.
