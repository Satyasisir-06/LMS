-- ============================================================================
--  Athenaeum — Phase 4 Schema: Multi-Branch, Wishlists & Digital Library
-- ============================================================================
--  Adds wishlists, inter-branch transfers, an eBooks table, and a private
--  Supabase Storage bucket for digital titles.
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
create type transfer_status as enum ('pending', 'completed', 'cancelled');

-- ── Wishlists ───────────────────────────────────────────────────────────────
create table if not exists public.wishlists (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid not null references public.profiles(id) on delete cascade,
  book_id   uuid not null references public.books(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, book_id)
);

create trigger wishlists_set_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

alter table public.wishlists enable row level security;

create policy "Users manage own wishlist"
  on public.wishlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Staff view wishlists"
  on public.wishlists for select
  using (public.is_staff());

-- ── Inter-branch transfers ───────────────────────────────────────────────────
create table if not exists public.transfers (
  id             uuid primary key default gen_random_uuid(),
  copy_id        uuid not null references public.book_copies(id) on delete restrict,
  from_branch_id uuid references public.branches(id),
  to_branch_id   uuid references public.branches(id),
  requested_by   uuid references public.profiles(id) on delete set null,
  status         transfer_status not null default 'pending',
  created_at     timestamptz not null default now(),
  completed_at   timestamptz
);

alter table public.transfers enable row level security;

create policy "Users request own transfers"
  on public.transfers for insert
  with check (auth.uid() = requested_by);

create policy "Users view own transfers"
  on public.transfers for select
  using (auth.uid() = requested_by or public.is_staff());

create policy "Staff manage transfers"
  on public.transfers for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── eBooks (digital titles) ──────────────────────────────────────────────────
create table if not exists public.ebooks (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid not null references public.books(id) on delete cascade unique,
  file_path  text not null,
  format     text not null default 'pdf',
  title      text,
  created_at timestamptz not null default now()
);

alter table public.ebooks enable row level security;

create policy "Public read ebooks"
  on public.ebooks for select using (true);

create policy "Staff manage ebooks"
  on public.ebooks for all
  using (public.is_staff())
  with check (public.is_staff());

-- ── Storage bucket for eBook files (private) ─────────────────────────────────
insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
  values (
    'ebooks',
    'ebooks',
    false,
    array['application/pdf', 'application/epub+zip'],
    52428800 -- 50 MB
  )
  on conflict (id) do nothing;

-- Authenticated members may read eBooks; staff may manage them.
create policy "Members read ebooks bucket"
  on storage.objects for select
  using (bucket_id = 'ebooks' and auth.uid() is not null);

create policy "Staff manage ebooks bucket"
  on storage.objects for all
  using (bucket_id = 'ebooks' and public.is_staff())
  with check (bucket_id = 'ebooks' and public.is_staff());
