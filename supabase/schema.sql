-- ============================================================
-- Readify Ebook Marketplace - Supabase Database Schema
-- South Africa | ZAR | 15% VAT | CIPC Registration
-- ============================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";  -- for fuzzy search

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table public.profiles (
  id          uuid references auth.users on delete cascade primary key,
  email       text,
  full_name   text,
  avatar_url  text,
  role        text not null default 'buyer' check (role in ('buyer','publisher','admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Public profiles are viewable"
  on public.profiles for select using (true);

-- ============================================================
-- PUBLISHERS (business info)
-- ============================================================
create table public.publishers (
  id                      uuid references public.profiles on delete cascade primary key,
  company_name            text not null,
  vat_number              text,                  -- SA VAT: 4XXXXXXXXXX (10 digits)
  cipc_registration       text,                  -- e.g. 2023/123456/07
  physical_address        text,
  city                    text,
  province                text,
  postal_code             text,
  country                 text not null default 'South Africa',
  phone                   text,
  website                 text,
  bio                     text,
  logo_url                text,
  bank_name               text,
  bank_account_number     text,
  bank_account_type       text,
  bank_branch_code        text,
  status                  text not null default 'pending' check (status in ('pending','approved','rejected','suspended')),
  rejection_reason        text,
  commission_rate         decimal(5,2) not null default 20.00, -- platform takes 20%
  total_earnings          decimal(12,2) not null default 0,
  total_books             integer not null default 0,
  approved_at             timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.publishers enable row level security;

create policy "Publisher can view own record"
  on public.publishers for select using (auth.uid() = id);
create policy "Publisher can update own record"
  on public.publishers for update using (auth.uid() = id);
create policy "Admins can manage publishers"
  on public.publishers for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Public can view approved publishers"
  on public.publishers for select using (status = 'approved');

-- ============================================================
-- CATEGORIES
-- ============================================================
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text,
  icon        text,
  parent_id   uuid references public.categories(id),
  sort_order  integer default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "Categories are public" on public.categories for select using (true);

-- Seed default categories
insert into public.categories (name, slug, description, icon, sort_order) values
  ('Business & Finance',    'business-finance',    'Entrepreneurship, investing, and personal finance', '💼', 1),
  ('Agriculture & Science', 'agriculture-science', 'Farming, food science, and agricultural technology',  '🌱', 2),
  ('Self Development',      'self-development',    'Personal growth, leadership, and mindset',            '🧠', 3),
  ('Marketing & Sales',     'marketing-sales',     'Digital marketing, SEO, and sales strategies',        '📈', 4),
  ('Technology',            'technology',          'Software, AI, crypto, and emerging tech',             '💻', 5),
  ('Real Estate',           'real-estate',         'Property investment and real estate strategies',       '🏘️', 6),
  ('Fiction',               'fiction',             'Novels, short stories, and creative writing',         '📖', 7),
  ('Other',                 'other',               'Miscellaneous topics',                                '📚', 8);

-- ============================================================
-- BOOKS / EBOOKS
-- ============================================================
create table public.books (
  id                uuid primary key default gen_random_uuid(),
  publisher_id      uuid references public.publishers(id) not null,
  category_id       uuid references public.categories(id),
  title             text not null,
  slug              text not null unique,
  subtitle          text,
  description       text,
  author            text,
  isbn              text,
  language          text not null default 'English',
  pages             integer,
  publication_date  date,
  cover_url         text,
  file_url          text,                -- Supabase Storage path (private bucket)
  drive_file_id     text,               -- Google Drive file ID (for existing catalog)
  sample_url        text,               -- free sample/preview
  price             decimal(10,2) not null default 0,
  original_price    decimal(10,2),      -- for showing discount
  currency          text not null default 'ZAR',
  status            text not null default 'draft' check (status in ('draft','published','unpublished','rejected')),
  featured          boolean not null default false,
  on_sale           boolean not null default false,
  sale_ends_at      timestamptz,
  tags              text[] default '{}',
  total_sales       integer not null default 0,
  total_revenue     decimal(12,2) not null default 0,
  rating            decimal(3,2) not null default 0,
  review_count      integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index books_publisher_idx on public.books(publisher_id);
create index books_category_idx  on public.books(category_id);
create index books_status_idx    on public.books(status);
create index books_slug_idx      on public.books(slug);
create index books_search_idx    on public.books using gin(to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(author,'')));

alter table public.books enable row level security;

create policy "Anyone can view published books"
  on public.books for select using (status = 'published');
create policy "Publishers can manage own books"
  on public.books for all using (auth.uid() = publisher_id);
create policy "Admins can manage all books"
  on public.books for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- PROMOTIONS / DISCOUNT CODES
-- ============================================================
create table public.promotions (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  code              text unique,
  discount_type     text not null check (discount_type in ('percentage','fixed')),
  discount_value    decimal(10,2) not null,
  min_order_amount  decimal(10,2),
  max_uses          integer,
  used_count        integer not null default 0,
  applicable_to     text not null default 'all' check (applicable_to in ('all','specific_books','specific_categories')),
  book_ids          uuid[] default '{}',
  category_ids      uuid[] default '{}',
  starts_at         timestamptz,
  expires_at        timestamptz,
  is_active         boolean not null default true,
  created_by        uuid references public.profiles(id),
  created_at        timestamptz not null default now()
);

alter table public.promotions enable row level security;
create policy "Active promos are public" on public.promotions for select using (is_active = true);
create policy "Admins manage promos" on public.promotions for all using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id              uuid primary key default gen_random_uuid(),
  buyer_id        uuid references public.profiles(id),
  status          text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  subtotal        decimal(10,2) not null,
  discount        decimal(10,2) not null default 0,
  vat_amount      decimal(10,2) not null default 0,   -- 15% SA VAT
  vat_rate        decimal(5,2) not null default 15.00,
  total           decimal(10,2) not null,
  currency        text not null default 'ZAR',
  payment_method  text check (payment_method in ('payfast','stripe','paypal','coinbase','free')),
  payment_id      text,                               -- external payment reference
  promotion_id    uuid references public.promotions(id),
  promotion_code  text,
  buyer_name      text,
  buyer_email     text not null,
  metadata        jsonb default '{}',
  created_at      timestamptz not null default now(),
  paid_at         timestamptz,
  updated_at      timestamptz not null default now()
);

create index orders_buyer_idx  on public.orders(buyer_id);
create index orders_status_idx on public.orders(status);

alter table public.orders enable row level security;

create policy "Buyers can view own orders"
  on public.orders for select using (auth.uid() = buyer_id);
create policy "Admins can view all orders"
  on public.orders for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Buyers can create own orders"
  on public.orders for insert
  with check (buyer_id = auth.uid() or buyer_id is null);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table public.order_items (
  id            uuid primary key default gen_random_uuid(),
  order_id      uuid references public.orders(id) on delete cascade not null,
  book_id       uuid references public.books(id) not null,
  publisher_id  uuid references public.publishers(id) not null,
  title         text not null,
  cover_url     text,
  price         decimal(10,2) not null,
  created_at    timestamptz not null default now()
);

create index order_items_order_idx     on public.order_items(order_id);
create index order_items_publisher_idx on public.order_items(publisher_id);

alter table public.order_items enable row level security;
create policy "Order item visible to buyer"
  on public.order_items for select using (
    exists (select 1 from public.orders where id = order_id and buyer_id = auth.uid())
  );
create policy "Order item visible to publisher"
  on public.order_items for select using (auth.uid() = publisher_id);
create policy "Admins view all order items"
  on public.order_items for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Buyers can add items to own orders"
  on public.order_items for insert
  with check (
    exists (select 1 from public.orders where id = order_id and (buyer_id = auth.uid() or buyer_id is null))
  );

-- ============================================================
-- DOWNLOADS (secure token-based access)
-- ============================================================
create table public.downloads (
  id               uuid primary key default gen_random_uuid(),
  order_item_id    uuid references public.order_items(id) not null,
  buyer_id         uuid references public.profiles(id) not null,
  book_id          uuid references public.books(id) not null,
  download_token   text unique not null,
  download_count   integer not null default 0,
  max_downloads    integer not null default 5,
  expires_at       timestamptz not null default (now() + interval '1 year'),
  last_downloaded  timestamptz,
  created_at       timestamptz not null default now()
);

create index downloads_buyer_idx on public.downloads(buyer_id);
create index downloads_token_idx on public.downloads(download_token);
create index downloads_book_idx  on public.downloads(book_id);

alter table public.downloads enable row level security;
create policy "Buyers can view own downloads"
  on public.downloads for select using (auth.uid() = buyer_id);

-- ============================================================
-- REVIEWS
-- ============================================================
create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  book_id     uuid references public.books(id) on delete cascade not null,
  buyer_id    uuid references public.profiles(id) on delete cascade not null,
  rating      integer not null check (rating >= 1 and rating <= 5),
  title       text,
  comment     text,
  is_verified boolean not null default false,  -- verified purchase
  created_at  timestamptz not null default now(),
  unique (book_id, buyer_id)
);

alter table public.reviews enable row level security;
create policy "Reviews are public" on public.reviews for select using (true);
create policy "Buyers can add reviews" on public.reviews for insert
  with check (auth.uid() = buyer_id);

-- ============================================================
-- WISHLIST
-- ============================================================
create table public.wishlist (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete cascade not null,
  book_id     uuid references public.books(id) on delete cascade not null,
  created_at  timestamptz not null default now(),
  unique (user_id, book_id)
);

alter table public.wishlist enable row level security;
create policy "Users manage own wishlist" on public.wishlist for all using (auth.uid() = user_id);

-- ============================================================
-- PUBLISHER PAYOUTS
-- ============================================================
create table public.payouts (
  id              uuid primary key default gen_random_uuid(),
  publisher_id    uuid references public.publishers(id) not null,
  amount          decimal(12,2) not null,
  currency        text not null default 'ZAR',
  status          text not null default 'pending' check (status in ('pending','processing','paid','failed')),
  payment_method  text,
  reference       text,
  notes           text,
  period_start    date,
  period_end      date,
  created_at      timestamptz not null default now(),
  processed_at    timestamptz
);

alter table public.payouts enable row level security;
create policy "Publishers view own payouts"
  on public.payouts for select using (auth.uid() = publisher_id);
create policy "Admins manage payouts"
  on public.payouts for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- TRIGGERS: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger-only: never callable through the REST API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Called by lib/fulfillment.ts (service role) once an order is paid:
-- bumps the book's sales counters and credits the publisher's net earnings.
create or replace function public.increment_book_sales(p_book_id uuid, p_price numeric)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_publisher_id uuid;
  v_commission   numeric;
begin
  update public.books
  set total_sales   = total_sales + 1,
      total_revenue = total_revenue + coalesce(p_price, 0),
      updated_at    = now()
  where id = p_book_id
  returning publisher_id into v_publisher_id;

  if v_publisher_id is not null then
    select commission_rate into v_commission from public.publishers where id = v_publisher_id;
    update public.publishers
    set total_earnings = total_earnings + coalesce(p_price, 0) * (1 - coalesce(v_commission, 20) / 100),
        updated_at     = now()
    where id = v_publisher_id;
  end if;
end;
$$;

-- Only the service role (lib/fulfillment.ts) may call this; otherwise any visitor
-- could inflate sales counters and publisher earnings via /rest/v1/rpc.
revoke execute on function public.increment_book_sales(uuid, numeric) from public, anon, authenticated;
grant  execute on function public.increment_book_sales(uuid, numeric) to service_role;

-- Trigger: update book rating when review added
create or replace function public.update_book_rating()
returns trigger language plpgsql set search_path = public as $$
begin
  update public.books
  set
    rating = (select avg(rating)::decimal(3,2) from public.reviews where book_id = new.book_id),
    review_count = (select count(*) from public.reviews where book_id = new.book_id)
  where id = new.book_id;
  return new;
end;
$$;

create trigger on_review_created
  after insert or update on public.reviews
  for each row execute function public.update_book_rating();

-- ============================================================
-- STORAGE BUCKETS + OBJECT POLICIES
-- ============================================================
insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false),
       ('covers', 'covers', true),
       ('logos',  'logos',  true)
on conflict (id) do nothing;

-- Public buckets are readable by anyone; ebooks are only served via signed URLs
-- generated with the service role (app/api/download/[token]/route.ts).
create policy "Public read of covers and logos"
  on storage.objects for select
  using (bucket_id in ('covers', 'logos'));

-- Authenticated users may write only under <bucket>/<their uid>/... paths,
-- which is how the upload page names files (covers/<uid>/..., ebooks/<uid>/...).
create policy "Users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('ebooks', 'covers', 'logos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users update own files"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('ebooks', 'covers', 'logos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users delete own files"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('ebooks', 'covers', 'logos')
    and (storage.foldername(name))[2] = auth.uid()::text
  );
