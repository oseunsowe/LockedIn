create type public.proof_type as enum ('photo', 'voice', 'screenshot', 'file');

create table public.proofs (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.proof_type not null,
  -- Path into a private Storage bucket (never public) — signed, expiring URLs only, per
  -- TODO.md §8.1. The bucket itself is created via the Supabase dashboard/CLI, not a migration.
  storage_path text not null,
  submitted_at timestamptz not null default now()
);

create index proofs_mission_id_idx on public.proofs (mission_id);

alter table public.proofs enable row level security;

create policy "proofs_select_own" on public.proofs
  for select using (auth.uid() = user_id);

create policy "proofs_insert_own" on public.proofs
  for insert with check (auth.uid() = user_id);

-- No update/delete policy: a submitted proof is immutable. Resubmission after a low-confidence
-- verification (TODO.md §8.3's "generous resubmit path") creates a new proof row, not an edit.

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  proof_id uuid not null references public.proofs (id) on delete cascade,
  verified boolean not null,
  confidence numeric(5, 2) not null check (confidence >= 0 and confidence <= 100),
  reasoning text,
  suggested_xp integer,
  created_at timestamptz not null default now()
);

create index verifications_proof_id_idx on public.verifications (proof_id);

alter table public.verifications enable row level security;

-- Verifications are written ONLY by the server (service_role, from the AI-verification Edge
-- Function — TODO.md §8.1: "the Claude API key never ships in the app bundle... all calls go
-- through your own server function"). service_role bypasses RLS entirely, so deliberately no
-- insert/update/delete policy exists here for the authenticated role. Users may only read
-- verifications for proofs they own.
create policy "verifications_select_own" on public.verifications
  for select using (
    exists (
      select 1 from public.proofs
      where proofs.id = verifications.proof_id and proofs.user_id = auth.uid()
    )
  );
