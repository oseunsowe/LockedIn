-- Fixes a real naming mistake caught during actual deployment (2026-09-12): every reference to
-- the marketing domain up to this point (this table's own default, TODO.md, the landing page's
-- own commit messages) said "lockedinmissions.app" (plural). DNS and the account's own cPanel
-- documentation confirm the real, live, registered domain is "lockedinmission.app" (singular) —
-- the plural spelling doesn't resolve at all. Existing rows (if any were written with the wrong
-- default before this fix) are corrected in place; the column default is corrected for every
-- signup from here on.
update public.waitlist_signups set source = 'lockedinmission.app' where source = 'lockedinmissions.app';

alter table public.waitlist_signups alter column source set default 'lockedinmission.app';
