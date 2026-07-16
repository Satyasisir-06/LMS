-- Athenaeum — per-user "read" memory for the in-app notifications bell.
--
-- Notifications are derived live from holds/borrowings (see
-- app/components/layout/notifications-bell.tsx). This table records which
-- notification keys a user has already seen so the unread badge stays
-- accurate across sessions instead of always reflecting every open item.

create table if not exists public.notification_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  key     text not null,
  read_at timestamptz not null default now(),
  primary key (user_id, key)
);

create index if not exists notification_reads_user_idx
  on public.notification_reads (user_id);

alter table public.notification_reads enable row level security;

drop policy if exists "Users manage own notification reads"
  on public.notification_reads;
create policy "Users manage own notification reads"
  on public.notification_reads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
