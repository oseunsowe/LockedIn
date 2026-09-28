-- Landing page v2: first-party analytics events + UTM attribution on waitlist signups.
-- Both are written by the public marketing page with the publishable key, so like waitlist_signups
-- each table has exactly one policy: anonymous INSERT, no SELECT (only service_role / the admin
-- dashboard can read). Length/allow-list checks keep a scraped key from stuffing the tables.

alter table public.waitlist_signups
  add column if not exists utm_source text check (char_length(utm_source) <= 120),
  add column if not exists utm_medium text check (char_length(utm_medium) <= 120),
  add column if not exists utm_campaign text check (char_length(utm_campaign) <= 120),
  add column if not exists utm_content text check (char_length(utm_content) <= 120),
  add column if not exists utm_term text check (char_length(utm_term) <= 120),
  add column if not exists referrer text check (char_length(referrer) <= 200),
  add column if not exists landing_path text check (char_length(landing_path) <= 200);

create table public.landing_events (
  id bigint generated always as identity primary key,
  event text not null check (event in (
    'landing_view', 'hero_early_access_click', 'hero_watch_demo_click',
    'discover_view', 'mission_section_view', 'focus_section_view', 'proof_section_view',
    'verification_section_view', 'creator_series_view',
    'waitlist_form_started', 'waitlist_form_submitted', 'waitlist_form_success', 'waitlist_form_error',
    'scroll_25', 'scroll_50', 'scroll_75', 'scroll_90', 'social_outbound_click'
  )),
  session_id text check (char_length(session_id) <= 64),
  path text check (char_length(path) <= 200),
  utm_source text check (char_length(utm_source) <= 120),
  utm_medium text check (char_length(utm_medium) <= 120),
  utm_campaign text check (char_length(utm_campaign) <= 120),
  utm_content text check (char_length(utm_content) <= 120),
  utm_term text check (char_length(utm_term) <= 120),
  props jsonb not null default '{}'::jsonb check (pg_column_size(props) <= 1024),
  created_at timestamptz not null default now()
);

create index landing_events_event_created_idx on public.landing_events (event, created_at desc);
create index landing_events_utm_source_idx on public.landing_events (utm_source) where utm_source is not null;

alter table public.landing_events enable row level security;

create policy "landing_events_insert_anon" on public.landing_events
  for insert to anon
  with check (true);
