-- RevenueCat delivers webhooks at-least-once and not always in order (a RENEWAL can arrive after
-- the EXPIRATION that followed it). `last_event_at` is the event timestamp of the most recent
-- webhook applied to this row, so revenuecat-webhook can drop any event older than what it has
-- already applied instead of letting a stale one overwrite newer state. Written only by that
-- service_role function, like every other column on this table.
alter table public.subscriptions
  add column if not exists last_event_at timestamptz;
