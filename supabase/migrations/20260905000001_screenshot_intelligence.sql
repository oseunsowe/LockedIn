-- Screenshot Intelligence (TODO.md §10, the spec's explicitly-called-out differentiator: "the
-- single largest cost lever" and "get privacy wrong once and the product is finished"). This
-- migration only ever stores the AI's *extracted text* — a real, deliberate design choice, not an
-- oversight: §10's non-negotiable privacy rule is "never persist raw screenshots server-side,"
-- so unlike `proofs` (which legitimately needs a Storage bucket for evidence), there is no bucket
-- here and never should be. `scan-screenshots` (the Edge Function) receives image bytes in the
-- request body, forwards them to Claude for extraction, and discards them — nothing about the
-- image itself is ever written to a table or a bucket, only the short text result.

create table public.extracted_intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  intention text not null,
  category public.campaign_key not null,
  confidence numeric not null check (confidence >= 0 and confidence <= 100),
  status text not null default 'pending' check (status in ('pending', 'converted', 'ignored')),
  created_at timestamptz not null default now()
);

create index extracted_intentions_user_id_status_idx
  on public.extracted_intentions (user_id, status);

alter table public.extracted_intentions enable row level security;

create policy "extracted_intentions_select_own" on public.extracted_intentions
  for select using (auth.uid() = user_id);

-- Users can move their own suggestions to `converted`/`ignored` (the Review screen's per-item
-- actions) — this is just a status flag on their own draft text, not a value-granting mutation, so
-- a plain client update is fine here unlike xp_events/verifications. No insert/delete policy: new
-- rows are written only by the scan-screenshots Edge Function via service_role — a compromised
-- client fabricating fake "AI-found" intentions has no path to do so.
create policy "extracted_intentions_update_own" on public.extracted_intentions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Per-user, per-day scan quota (same "a compromised client should cost you dollars, not
-- thousands" reasoning as ai_verification_usage — see 20260901000008_ai_verification_quota.sql —
-- but counted in images-scanned, not calls, since a single scan request can carry a whole batch).
create table public.screenshot_scan_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  usage_date date not null default current_date,
  images_scanned integer not null default 0,
  primary key (user_id, usage_date)
);

alter table public.screenshot_scan_usage enable row level security;
-- Deliberately zero policies: only service_role (which bypasses RLS) ever touches this table.

create or replace function public.increment_screenshot_scan_usage(p_user_id uuid, p_count integer)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.screenshot_scan_usage (user_id, usage_date, images_scanned)
  values (p_user_id, current_date, p_count)
  on conflict (user_id, usage_date)
  do update set images_scanned = public.screenshot_scan_usage.images_scanned + p_count
  returning images_scanned into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_screenshot_scan_usage(uuid, integer)
  from public, anon, authenticated;
