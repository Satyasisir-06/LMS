-- ============================================================================
--  Athenaeum — Phase 2 Schema: Catalog & Circulation Core
-- ============================================================================

-- ── Enums ───────────────────────────────────────────────────────────────────
create type copy_status as enum ('available', 'borrowed', 'reserved', 'lost', 'damaged');
create type borrowing_status as enum ('active', 'returned', 'overdue', 'lost');
create type hold_status as enum ('pending', 'fulfilled', 'cancelled');

-- ── Authors ─────────────────────────────────────────────────────────────────
create table if not exists public.authors (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  bio         text,
  photo_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Categories ──────────────────────────────────────────────────────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- ── Books ───────────────────────────────────────────────────────────────────
create table if not exists public.books (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  isbn             text unique not null,
  description      text,
  publisher        text,
  language         text default 'English',
  edition          text,
  publication_year integer,
  cover_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ── Book Authors & Categories (Many-to-Many) ────────────────────────────────
create table if not exists public.book_authors (
  book_id   uuid references public.books(id) on delete cascade,
  author_id uuid references public.authors(id) on delete cascade,
  primary key (book_id, author_id)
);

create table if not exists public.book_categories (
  book_id     uuid references public.books(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  primary key (book_id, category_id)
);

-- ── Branches ────────────────────────────────────────────────────────────────
create table if not exists public.branches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  location    text not null,
  created_at  timestamptz not null default now()
);

-- ── Book Copies ─────────────────────────────────────────────────────────────
create table if not exists public.book_copies (
  id             uuid primary key default gen_random_uuid(),
  book_id        uuid references public.books(id) on delete cascade,
  branch_id      uuid references public.branches(id) on delete restrict,
  barcode        text unique not null,
  shelf_location text,
  condition      text default 'Good',
  status         copy_status not null default 'available',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ── Borrowings ──────────────────────────────────────────────────────────────
create table if not exists public.borrowings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete restrict,
  copy_id      uuid references public.book_copies(id) on delete restrict,
  issue_date   timestamptz not null default now(),
  due_date     timestamptz not null,
  return_date  timestamptz,
  status       borrowing_status not null default 'active',
  fine_amount  numeric(10,2) default 0.00,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Holds / Reservations ────────────────────────────────────────────────────
create table if not exists public.holds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  book_id      uuid references public.books(id) on delete cascade,
  status       hold_status not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Triggers (updated_at) ───────────────────────────────────────────────────
create trigger authors_set_updated_at before update on public.authors for each row execute function public.set_updated_at();
create trigger books_set_updated_at before update on public.books for each row execute function public.set_updated_at();
create trigger copies_set_updated_at before update on public.book_copies for each row execute function public.set_updated_at();
create trigger borrowings_set_updated_at before update on public.borrowings for each row execute function public.set_updated_at();
create trigger holds_set_updated_at before update on public.holds for each row execute function public.set_updated_at();

-- ── Row Level Security (RLS) ────────────────────────────────────────────────
alter table public.authors enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.book_authors enable row level security;
alter table public.book_categories enable row level security;
alter table public.branches enable row level security;
alter table public.book_copies enable row level security;
alter table public.borrowings enable row level security;
alter table public.holds enable row level security;

-- Public read access to catalog
create policy "Public read access to authors" on public.authors for select using (true);
create policy "Public read access to categories" on public.categories for select using (true);
create policy "Public read access to books" on public.books for select using (true);
create policy "Public read access to book_authors" on public.book_authors for select using (true);
create policy "Public read access to book_categories" on public.book_categories for select using (true);
create policy "Public read access to branches" on public.branches for select using (true);
create policy "Public read access to book_copies" on public.book_copies for select using (true);

-- Staff write access to catalog
create policy "Staff manage authors" on public.authors for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage categories" on public.categories for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage books" on public.books for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage book_authors" on public.book_authors for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage book_categories" on public.book_categories for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage branches" on public.branches for all using (public.is_staff()) with check (public.is_staff());
create policy "Staff manage book_copies" on public.book_copies for all using (public.is_staff()) with check (public.is_staff());

-- Borrowings: Users can see their own, staff can see all & manage
create policy "Users can view own borrowings" on public.borrowings for select using (auth.uid() = user_id or public.is_staff());
create policy "Staff manage borrowings" on public.borrowings for all using (public.is_staff()) with check (public.is_staff());

-- Holds: Users can see and insert their own, staff can manage all
create policy "Users can view own holds" on public.holds for select using (auth.uid() = user_id or public.is_staff());
create policy "Users can insert own holds" on public.holds for insert with check (auth.uid() = user_id);
create policy "Users can update own holds" on public.holds for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Staff manage holds" on public.holds for all using (public.is_staff()) with check (public.is_staff());
