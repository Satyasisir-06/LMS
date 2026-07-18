-- Allow staff (librarian/admin) to upload and manage book cover images in
-- the "Books" storage bucket from the admin/manage UI. Public read is already
-- enabled on the bucket itself.
create policy "Staff upload book covers"
on storage.objects
for insert
to authenticated
with check ( bucket_id = 'Books' and public.is_staff() );

create policy "Staff update book covers"
on storage.objects
for update
to authenticated
using ( bucket_id = 'Books' and public.is_staff() )
with check ( bucket_id = 'Books' and public.is_staff() );

create policy "Staff delete book covers"
on storage.objects
for delete
to authenticated
using ( bucket_id = 'Books' and public.is_staff() );
