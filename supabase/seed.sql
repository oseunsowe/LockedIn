-- The three achievements explicitly named in docs/DESIGN-SYSTEM.md §4 / TODO.md Phase 9.
-- `icon` values are app/src/theme/icons.tsx IconName keys, not emoji — see TODO.md §2.1's
-- "remove every emoji from the spec" item.
insert into public.achievements (key, label, description, icon) values
  ('first_mission', 'First Mission', 'Complete your first mission.', 'verified'),
  ('thirty_day_streak', '30 Day Streak', 'Keep a 30-day streak alive.', 'streak'),
  ('deep_focus_master', 'Deep Focus Master', 'Complete 10 missions in Active Mission Mode.', 'timer')
on conflict (key) do nothing;
