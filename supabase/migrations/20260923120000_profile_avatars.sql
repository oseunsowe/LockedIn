-- Profile pictures. `avatar_url` holds the public URL of the user's picture in the `avatars`
-- Storage bucket. Unlike `proofs` (private, signed URLs), avatars are meant to be displayed
-- without auth headers, so the bucket is public-read; writes are still locked to the owner's own
-- `{user_id}/` folder, same path-prefix RLS pattern as the proofs bucket.
alter table public.profiles add column if not exists avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatar_storage_insert_own" on storage.objects;
create policy "avatar_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar_storage_update_own" on storage.objects;
create policy "avatar_storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar_storage_delete_own" on storage.objects;
create policy "avatar_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
