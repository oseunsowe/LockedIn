-- The campaign catalog (label/accent/icon) is static app config that lives client-side in
-- app/src/theme/campaigns.ts — this enum is the only thing the database needs to know about
-- campaigns: which key a user picked. Keep these two lists in sync by hand; there are only 8.
create type public.campaign_key as enum (
  'careerGrowth', 'buildBusiness', 'learnSkill', 'improveFitness',
  'increaseIncome', 'createContent', 'improveHealth', 'personalGrowth'
);

create table public.user_campaigns (
  user_id uuid not null references public.profiles (id) on delete cascade,
  campaign_key public.campaign_key not null,
  selected_at timestamptz not null default now(),
  primary key (user_id, campaign_key)
);

alter table public.user_campaigns enable row level security;

create policy "user_campaigns_all_own" on public.user_campaigns
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create type public.mission_type as enum ('main', 'side', 'daily');
-- 'recovery' is the "no shame" state for a failed mission (docs/DESIGN-SYSTEM.md) — never a
-- red/failed dead end, always a path back in.
create type public.mission_status as enum ('active', 'completed', 'failed', 'recovery');
create type public.mission_difficulty as enum ('standard', 'challenging', 'hard', 'epic');

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  campaign_key public.campaign_key,
  type public.mission_type not null default 'side',
  title text not null,
  difficulty public.mission_difficulty not null default 'standard',
  status public.mission_status not null default 'active',
  xp_reward integer not null check (xp_reward >= 0),
  -- e.g. [{"type": "photo"}, {"type": "voice"}] — matches the proof-type options in
  -- app/src/theme/icons.tsx's `proof` domain.
  proof_requirements jsonb not null default '[]'::jsonb,
  deadline timestamptz,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index missions_user_id_status_idx on public.missions (user_id, status);

alter table public.missions enable row level security;

create policy "missions_all_own" on public.missions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
