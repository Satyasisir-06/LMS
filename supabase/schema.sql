-- ============================================================================
--  Athenaeum — Phase 1 Schema: Authentication, RBAC & Profiles
-- ============================================================================
--  Run this in the Supabase SQL editor (or via `supabase db push`).
--  Safe to re-run: statements are idempotent where it matters.
-- ============================================================================

-- ── Extensions ─────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Roles ──────────────────────────────────────────────────────────────────
-- Order encodes hierarchy (student < faculty < librarian < admin).
do $$ begin
  create type user_role as enum ('student', 'faculty', 'librarian', 'admin');
exception when duplicate_object then null; end $$;

-- ── Profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  role        user_role not null default 'student',
  avatar_url  text,
  department  text,
  phone       text,
  student_id  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists profiles_student_id_key
  on public.profiles (student_id) where student_id is not null;

-- ── updated_at maintenance ─────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ── Role helper functions (RLS-safe, SECURITY DEFINER) ─────────────────────
-- Reading the caller's role bypasses RLS to avoid recursion.
create or replace function public.current_user_role()
returns user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_user_role() in ('librarian', 'admin');
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_user_role() = 'admin';
$$;

-- ── Auto-create profile on signup ──────────────────────────────────────────
-- Reads `user_metadata` set by the React Router signup action
-- (full_name, role, student_id, department).
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, student_id, department)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    new.raw_user_meta_data ->> 'student_id',
    new.raw_user_meta_data ->> 'department'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Row Level Security ─────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff"
  on public.profiles for select
  using (auth.uid() = id or public.is_staff());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_all_admin" on public.profiles;
create policy "profiles_all_admin"
  on public.profiles for all
  using (public.is_admin())
  with check (public.is_admin());

-- No INSERT/DELETE policy for clients → only the service-role trigger & admins
-- can manage rows (admin "all" policy covers admin inserts/deletes).

-- ── Admin tooling: promote or change a user's role ─────────────────────────
-- Self-signup is limited to student/faculty; admins use this to grant
-- librarian/admin privileges.
create or replace function public.set_user_role(target uuid, new_role user_role)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'Only administrators may change user roles';
  end if;
  update public.profiles
    set role = new_role, updated_at = now()
    where id = target;
end;
$$;

-- ============================================================================
--  First-admin bootstrap:
--  Sign up once via the UI (creates a 'student' profile), then run:
--
--    update public.profiles set role = 'admin'
--    where id = (select id from auth.users where email = 'you@university.edu');
--
--  After that, use set_user_role() from the admin console to manage roles.
-- ============================================================================
