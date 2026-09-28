-- Security hardening found by probing production as an ordinary signed-in user (2026-09-28):
--
--   * PATCH /rest/v1/profiles {xp_total, level, streak_count, execution_score} all returned 200:
--     `profiles_update_own` is a row policy with no column restriction, so anyone could set their own
--     progression to any value. XP/level/streak are server-owned (xp_events trigger, streak function).
--   * `missions_all_own` let a client insert/update missions as already `completed` and with an
--     arbitrary `xp_reward`, which verify-proof then trusted as the XP to award.
--
-- Everything else probed was already blocked (forging xp_events / achievements / verifications,
-- quota + streak RPCs, subscriptions, cross-user reads and uploads).

-- 1. profiles: the client may only edit its own presentation/onboarding fields.
--    (service_role and the SECURITY DEFINER triggers/functions keep full access.)
revoke update on public.profiles from anon, authenticated;
grant update (display_name, identity_class, onboarding_completed_at, timezone, avatar_url)
  on public.profiles to authenticated;

-- 2. missions: clients can create ACTIVE missions and move them between active <-> recovery.
--    Completion happens only in verify-proof (service_role), so it can no longer be self-declared.
drop policy if exists "missions_all_own" on public.missions;
drop policy if exists "missions_select_own" on public.missions;
drop policy if exists "missions_insert_own" on public.missions;
drop policy if exists "missions_update_own" on public.missions;
drop policy if exists "missions_delete_own" on public.missions;

create policy "missions_select_own" on public.missions
  for select using (auth.uid() = user_id);

create policy "missions_insert_own" on public.missions
  for insert with check (auth.uid() = user_id and status = 'active' and completed_at is null);

create policy "missions_update_own" on public.missions
  for update
  using (auth.uid() = user_id and status in ('active', 'recovery'))
  with check (auth.uid() = user_id and status in ('active', 'recovery') and completed_at is null);

create policy "missions_delete_own" on public.missions
  for delete using (auth.uid() = user_id);

-- 3. Hard caps as defence in depth (NOT VALID: applies to new/updated rows without rewriting history).
--    Per-difficulty limits are enforced in verify-proof; these stop absurd values outright.
alter table public.missions drop constraint if exists missions_xp_reward_cap;
alter table public.missions
  add constraint missions_xp_reward_cap check (xp_reward between 0 and 1500) not valid;

alter table public.xp_events drop constraint if exists xp_events_amount_cap;
alter table public.xp_events
  add constraint xp_events_amount_cap check (amount <= 1500) not valid;
