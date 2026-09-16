create type public.subscription_tier as enum ('free', 'pro', 'elite');
create type public.subscription_status as enum ('active', 'trialing', 'canceled', 'expired');

create table public.subscriptions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  tier public.subscription_tier not null default 'free',
  status public.subscription_status not null default 'active',
  revenuecat_app_user_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- No insert/update/delete policy for authenticated users: subscription state is written only
-- by the RevenueCat webhook handler (a service_role Edge Function). TODO.md §12: "Server-side
-- entitlement checks. Never trust a client boolean for a paid AI call."

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Give every new profile a free-tier row immediately, mirroring the profile-creation trigger
-- in 20260901000001_profiles.sql — same rationale: no client round trip, no race window.
create or replace function public.handle_new_profile_subscription()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.subscriptions (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created_subscription
  after insert on public.profiles
  for each row execute function public.handle_new_profile_subscription();
