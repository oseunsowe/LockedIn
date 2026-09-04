-- RLS policies for the private `proofs` Storage bucket (TODO.md §8.1: "proof media in private
-- storage with signed, expiring URLs. Never public buckets."). The bucket itself is created via
-- the Supabase dashboard/CLI, not a migration (see 20260901000003_proofs_and_verifications.sql's
-- comment on `storage_path`) — but a policy on `storage.objects` scoped by `bucket_id` is valid to
-- create ahead of the bucket existing, since it's just a WHERE clause matched at request time.
--
-- Objects are keyed `{user_id}/{filename}` so RLS can scope access by path segment, mirroring the
-- `proofs` table's own `proofs_select_own`/`proofs_insert_own` policies.
create policy "proof_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "proof_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- No update/delete policy: matches `proofs`' immutability — a resubmission after a low-confidence
-- verification (§8.3's "generous resubmit path") uploads a new object, it doesn't edit one.
