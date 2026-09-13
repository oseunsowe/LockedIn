-- Optional scheduled time-of-day window on a mission (TODO.md Phase 17's Time-Blocking addition).
-- Lives directly on `missions` rather than a separate `focus_sessions` table, mirroring how
-- `deadline` already works: one atomic insert, no orphan-row risk if a second insert failed.
-- Deliberate trade-off accepted: one time block per mission, no reschedule history.

alter table public.missions
  add column start_time timestamptz,
  add column end_time timestamptz;

-- Both set or both null — a block is meaningless with only one edge.
alter table public.missions
  add constraint missions_time_block_both_or_neither
    check ((start_time is null) = (end_time is null));

alter table public.missions
  add constraint missions_time_block_valid_range
    check (end_time is null or end_time > start_time);

-- Powers the day-timeline view: only scheduled missions, ordered by start_time.
-- No RLS change needed — `missions_all_own` already covers all columns on this table.
create index missions_user_id_start_time_idx on public.missions (user_id, start_time)
  where start_time is not null;
