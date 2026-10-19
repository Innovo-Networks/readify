-- Publisher verification documents.
-- Applied to the live project only after the PR is reviewed.

alter table public.publishers
  add column if not exists cipc_document_path text,   -- CIPC registration certificate
  add column if not exists bank_letter_path   text,   -- bank letter showing account holder, number and branch
  add column if not exists vat_letter_path    text;   -- VAT registration letter (optional)

-- Private bucket: nobody can read these files without an admin or the publisher who uploaded them.
insert into storage.buckets (id, name, public)
values ('publisher-documents', 'publisher-documents', false)
on conflict (id) do nothing;

-- Publishers upload only under their own user id: <uid>/<file>
create policy "Publishers upload own verification documents"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'publisher-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Publishers and admins can read the documents.
create policy "Publishers and admins read verification documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'publisher-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  );
