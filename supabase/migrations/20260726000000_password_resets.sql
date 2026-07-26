-- ============================================================================
--  Password Reset Tokens & User Helper Migration
-- ============================================================================

-- Create table for storing hashed password reset tokens securely
create table if not exists public.password_reset_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  token_hash  text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Index token_hash for fast constant-time lookup
create index if not exists idx_password_reset_tokens_hash on public.password_reset_tokens (token_hash) where used = false;

-- Enable RLS (Service role only access)
alter table public.password_reset_tokens enable row level security;

-- Helper function to lookup user ID by email securely (used by server reset action)
create or replace function public.get_user_id_by_email(email_input text)
returns table (id uuid)
language sql security definer set search_path = public as $$
  select id from auth.users where lower(email) = lower(email_input) limit 1;
$$;
