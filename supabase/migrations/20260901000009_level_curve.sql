-- The XP curve (TODO.md §9 P0: "tune the early curve so levels 1-5 come fast (retention) and
-- later levels earn meaning"). 20260901000005_xp_ledger.sql deliberately left `profiles.level`
-- unmaintained pending this design — this migration is that design.
--
-- Formula: the XP required to go from level N to N+1 is `round(100 * N^1.5)` — a power curve, so
-- the increment itself grows with level, not just the cumulative total. Level 1->2 costs 100 XP
-- (one verified mission), level 10->11 costs ~3,162, level 50->51 costs ~35,355. Cumulative
-- thresholds below are PRECOMPUTED from that exact formula (not reimplemented in SQL) and must
-- match `app/src/lib/leveling.ts` bit-for-bit — two independent floating-point implementations of
-- the same formula risk disagreeing on some rounding boundary; a single generated table shared by
-- both client and server cannot. 100 levels is a generous MVP ceiling (~3.95M lifetime XP);
-- extending it later only means appending more rows, never changing existing ones.
create table public.level_thresholds (
  level integer primary key,
  -- Cumulative XP required to REACH this level. Level 1 = 0.
  cumulative_xp bigint not null unique
);

insert into public.level_thresholds (level, cumulative_xp) values
  (1, 0),
  (2, 100),
  (3, 383),
  (4, 903),
  (5, 1703),
  (6, 2821),
  (7, 4291),
  (8, 6143),
  (9, 8406),
  (10, 11106),
  (11, 14268),
  (12, 17916),
  (13, 22073),
  (14, 26760),
  (15, 31998),
  (16, 37807),
  (17, 44207),
  (18, 51216),
  (19, 58853),
  (20, 67135),
  (21, 76079),
  (22, 85702),
  (23, 96021),
  (24, 107051),
  (25, 118809),
  (26, 131309),
  (27, 144566),
  (28, 158596),
  (29, 173412),
  (30, 189029),
  (31, 205461),
  (32, 222721),
  (33, 240823),
  (34, 259780),
  (35, 279605),
  (36, 300311),
  (37, 321911),
  (38, 344417),
  (39, 367842),
  (40, 392197),
  (41, 417495),
  (42, 443748),
  (43, 470967),
  (44, 499164),
  (45, 528350),
  (46, 558537),
  (47, 589736),
  (48, 621958),
  (49, 655213),
  (50, 689513),
  (51, 724868),
  (52, 761289),
  (53, 798787),
  (54, 837372),
  (55, 877054),
  (56, 917843),
  (57, 959750),
  (58, 1002784),
  (59, 1046955),
  (60, 1092274),
  (61, 1138750),
  (62, 1186393),
  (63, 1235212),
  (64, 1285217),
  (65, 1336417),
  (66, 1388822),
  (67, 1442441),
  (68, 1497283),
  (69, 1553357),
  (70, 1610673),
  (71, 1669239),
  (72, 1729065),
  (73, 1790159),
  (74, 1852530),
  (75, 1916187),
  (76, 1981139),
  (77, 2047394),
  (78, 2114961),
  (79, 2183849),
  (80, 2254066),
  (81, 2325620),
  (82, 2398520),
  (83, 2472774),
  (84, 2548391),
  (85, 2625378),
  (86, 2703744),
  (87, 2783497),
  (88, 2864645),
  (89, 2947196),
  (90, 3031158),
  (91, 3116539),
  (92, 3203347),
  (93, 3291590),
  (94, 3381276),
  (95, 3472412),
  (96, 3565007),
  (97, 3659067),
  (98, 3754601),
  (99, 3851616),
  (100, 3950120);

-- Read-only reference data — every authenticated user can look up the curve (e.g. to show "XP to
-- next level" without a round trip), nobody can change it from the client.
alter table public.level_thresholds enable row level security;

create policy "level_thresholds_select_all" on public.level_thresholds
  for select to authenticated using (true);

create or replace function public.level_for_xp(p_xp bigint)
returns integer
language sql
stable
as $$
  select max(level) from public.level_thresholds where cumulative_xp <= p_xp;
$$;

-- Supersedes 20260901000005_xp_ledger.sql's apply_xp_event: same xp_total update, now also
-- deriving `level` from the curve above on every award — level is never set directly by anything
-- else, matching the "level and total are derived" rule this whole ledger design is built on.
create or replace function public.apply_xp_event()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_total bigint;
begin
  update public.profiles
  set xp_total = xp_total + new.amount
  where id = new.user_id
  returning xp_total into new_total;

  update public.profiles
  set level = public.level_for_xp(new_total)
  where id = new.user_id;

  return new;
end;
$$;
