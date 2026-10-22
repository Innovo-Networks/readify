-- Reports on published books (copyright, misattribution, offence, misleading content).
-- Anyone can submit; only admins can read or change reports.

create table if not exists public.book_reports (
  id             uuid primary key default gen_random_uuid(),
  book_id        uuid not null references public.books(id) on delete cascade,
  reporter_id    uuid references auth.users(id) on delete set null,
  reporter_name  text not null check (char_length(reporter_name) between 2 and 120),
  reporter_email text not null check (char_length(reporter_email) between 5 and 254),
  reason         text not null check (reason in ('copyright','misattributed','offensive','misleading','other')),
  details        text check (details is null or char_length(details) <= 2000),
  status         text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at     timestamptz not null default now()
);

create index if not exists book_reports_status_created_idx
  on public.book_reports (status, created_at desc);

alter table public.book_reports enable row level security;

create policy "Anyone can submit a book report"
  on public.book_reports for insert to anon, authenticated
  with check (true);

create policy "Admins read book reports"
  on public.book_reports for select to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

create policy "Admins update book reports"
  on public.book_reports for update to authenticated
  using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));
