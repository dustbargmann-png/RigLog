-- Photo storage for units, inventory items, and inspection logs.
-- Public bucket for MVP simplicity (photos aren't sensitive) — object paths are
-- namespaced by company_id so at least casual guessing of a URL is impractical.

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Path convention: {company_id}/{unit_id}/{filename}
-- (storage.foldername(name))[1] is the first path segment, i.e. company_id.

create policy "photos_insert_own_company" on storage.objects
  for insert
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = current_company_id()::text
  );

create policy "photos_update_own_company" on storage.objects
  for update
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = current_company_id()::text
  );

create policy "photos_delete_own_company" on storage.objects
  for delete
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = current_company_id()::text
  );
