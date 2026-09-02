-- Shared trigger helper: keep an `updated_at` column current on any row change.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  identity_class text check (
    identity_class in (
      'developer', 'founder', 'creator', 'student',
      'athlete', 'professional', 'entrepreneur', 'designer'
    )
  ),
  -- Cache of the xp_events ledger sum (see 20260901000005_xp_ledger.sql) — always re-derivable,
  -- never the source of truth. Never write to this column directly from client code.
  level integer not null default 1,
  xp_total bigint not null default 0,
  streak_count integer not null default 0,
  execution_score numeric(5, 2) not null default 0,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- No insert policy for authenticated users: rows are created only by the trigger below,
-- which runs as security definer. No delete policy: deletion happens only via the
-- `on delete cascade` from auth.users.

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row the moment a new auth user signs up, so the client never has to
-- perform a separate "create my profile" round trip (and never risks a race where a client
-- reads a profile before it exists).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
