-- Achievement engine (TODO.md §9 P1: "server-evaluated rules"). All three catalog achievements
-- (seed.sql) turn out to be evaluable from data that already exists — `deep_focus_master`'s
-- description ("Complete 10 missions in Active Mission Mode") is just a completed-mission count,
-- since every proof submission already routes through Active Mission Mode's "Submit Proof" button;
-- there is no separate focus-session telemetry to build first.
--
-- Called by the verify-proof Edge Function immediately after a mission is verified, alongside
-- record_mission_completion_streak() — same "service_role only, no client insert" pattern as every
-- other gamification write (see 20260901000004_achievements.sql's own comment on this).
create or replace function public.evaluate_and_award_achievements(p_user_id uuid)
returns text[]
language plpgsql
security definer set search_path = public
as $$
declare
  v_completed_count integer;
  v_streak_count integer;
  v_newly_unlocked text[] := '{}';
  v_key text;
begin
  select count(*) into v_completed_count
    from public.missions
    where user_id = p_user_id and status = 'completed';

  select streak_count into v_streak_count
    from public.profiles
    where id = p_user_id;

  if v_completed_count >= 1 then
    insert into public.user_achievements (user_id, achievement_key)
    values (p_user_id, 'first_mission')
    on conflict do nothing;
    if found then
      v_newly_unlocked := array_append(v_newly_unlocked, 'first_mission');
    end if;
  end if;

  if v_completed_count >= 10 then
    insert into public.user_achievements (user_id, achievement_key)
    values (p_user_id, 'deep_focus_master')
    on conflict do nothing;
    if found then
      v_newly_unlocked := array_append(v_newly_unlocked, 'deep_focus_master');
    end if;
  end if;

  if v_streak_count >= 30 then
    insert into public.user_achievements (user_id, achievement_key)
    values (p_user_id, 'thirty_day_streak')
    on conflict do nothing;
    if found then
      v_newly_unlocked := array_append(v_newly_unlocked, 'thirty_day_streak');
    end if;
  end if;

  return v_newly_unlocked;
end;
$$;

revoke all on function public.evaluate_and_award_achievements(uuid) from public, anon, authenticated;
