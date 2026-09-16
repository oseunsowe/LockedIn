-- Streak logic (TODO.md §9 P0: "timezone-correct day boundary, one grace day ('streak freeze')
-- to prevent rage-quit churn"). Previously `profiles.streak_count` was a plain column nothing ever
-- touched — this migration is what actually maintains it.
alter table public.profiles
  add column timezone text not null default 'UTC',
  add column last_streak_date date,
  add column streak_grace_used_at date;

comment on column public.profiles.timezone is
  'IANA timezone name (e.g. "America/New_York"), set by the client from Intl.DateTimeFormat().resolvedOptions().timeZone. Drives the "timezone-correct day boundary" for streaks — never derive a streak day from UTC directly.';
comment on column public.profiles.last_streak_date is
  'The last local calendar date (in `timezone`) a mission was verified on. Null until the first ever verification.';
comment on column public.profiles.streak_grace_used_at is
  'The local date the one-missed-day grace was last spent, or null if it is available. Reset to null whenever the streak restarts, so every new streak gets its own single grace day.';

-- Called by the verify-proof Edge Function immediately after a mission is verified — see
-- app/src/state/auth.tsx's profile-timezone sync and supabase/functions/verify-proof/index.ts.
-- `for update` locks the row for the duration of the function so two verifications landing at
-- nearly the same instant can't race each other into double-incrementing or double-resetting.
create or replace function public.record_mission_completion_streak(p_user_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  v_timezone text;
  v_last_date date;
  v_grace_used date;
  v_current_streak integer;
  v_today date;
  v_gap integer;
  v_new_streak integer;
begin
  select timezone, last_streak_date, streak_grace_used_at, streak_count
    into v_timezone, v_last_date, v_grace_used, v_current_streak
    from public.profiles
    where id = p_user_id
    for update;

  begin
    v_today := (now() at time zone v_timezone)::date;
  exception when others then
    -- A malformed/unrecognized timezone string must never break mission completion — fall back
    -- to UTC rather than let this function (and the XP/completion it's called alongside) fail.
    v_today := (now() at time zone 'UTC')::date;
  end;

  if v_last_date is null then
    -- First verification ever.
    v_new_streak := 1;
    v_grace_used := null;
  elsif v_today = v_last_date then
    -- Already recorded a completion today — a second mission the same day doesn't grow the
    -- streak further, and definitely shouldn't re-trigger the grace/reset logic below.
    return v_current_streak;
  else
    v_gap := v_today - v_last_date;
    if v_gap = 1 then
      -- Consecutive day.
      v_new_streak := v_current_streak + 1;
    elsif v_gap = 2 and v_grace_used is null then
      -- Exactly one day missed, and this streak hasn't spent its grace day yet: the streak
      -- survives (doesn't grow for the missed day, but doesn't reset either) and the grace is
      -- now spent — a second missed day before the next completion resets for real.
      v_new_streak := v_current_streak;
      v_grace_used := v_today;
    else
      -- More than one day missed, or the grace was already used this streak: restart.
      v_new_streak := 1;
      v_grace_used := null;
    end if;
  end if;

  update public.profiles
  set streak_count = v_new_streak,
      last_streak_date = v_today,
      streak_grace_used_at = v_grace_used
  where id = p_user_id;

  return v_new_streak;
end;
$$;

-- Only service_role (which ignores grants) should call this — same reasoning as
-- increment_ai_verification_usage in 20260901000008_ai_verification_quota.sql.
revoke all on function public.record_mission_completion_streak(uuid) from public, anon, authenticated;
