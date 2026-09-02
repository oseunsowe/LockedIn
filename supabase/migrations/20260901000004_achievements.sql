create table public.achievements (
  key text primary key,
  label text not null,
  description text not null,
  -- Semantic icon name (app/src/theme/icons.tsx IconName) for MVP, or a badge asset key once
  -- the illustrated SVGs from TODO.md §9 exist ("Budget real design time; these carry the
  -- reward feeling"). Not enforced by a check constraint — the client owns that mapping.
  icon text not null
);

alter table public.achievements enable row level security;

-- The catalog is public read-only reference data — every signed-in user can see what's
-- unlockable. No insert/update/delete policy: it's server/admin-managed only.
create policy "achievements_select_all" on public.achievements
  for select using (true);

create table public.user_achievements (
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_key text not null references public.achievements (key) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

alter table public.user_achievements enable row level security;

create policy "user_achievements_select_own" on public.user_achievements
  for select using (auth.uid() = user_id);

-- No insert policy for authenticated users: achievements are unlocked by a server-side rules
-- engine (TODO.md §9's "server-evaluated rules"), never self-reported by the client.
