-- ============================================================================
--  Athenaeum — Overdue Management System
--  Schema + RPCs for the dedicated Overdue section, fine collection,
--  reminders, and server-side (paginated/filtered) reporting.
-- ============================================================================

-- ── Profile enrichment (academic context) ─────────────────────────────────────
alter table public.profiles
  add column if not exists academic_year int,
  add column if not exists semester text;

-- Persist academic context from signup metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (
    id, full_name, role, student_id, department, academic_year, semester
  )
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    coalesce((new.raw_user_meta_data ->> 'role')::user_role, 'student'),
    new.raw_user_meta_data ->> 'student_id',
    new.raw_user_meta_data ->> 'department',
    nullif(new.raw_user_meta_data ->> 'academic_year', '')::int,
    nullif(new.raw_user_meta_data ->> 'semester', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ── Reminders (in-app + external channels) ───────────────────────────────────
create table if not exists public.reminders (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade,
  borrowing_id uuid references public.borrowings(id) on delete cascade,
  kind         text not null check (kind in ('pre_due', 'due', 'overdue_daily')),
  channel      text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  message      text,
  sent_at      timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists reminders_user_idx on public.reminders (user_id);
create index if not exists reminders_borrowing_idx on public.reminders (borrowing_id);

alter table public.reminders enable row level security;
create policy "Users read own reminders"
  on public.reminders for select
  using (auth.uid() = user_id or public.is_staff());
create policy "Staff manage reminders"
  on public.reminders for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Fine payments (receipts for collected fines) ─────────────────────────────
create table if not exists public.fine_payments (
  id            uuid primary key default gen_random_uuid(),
  borrowing_id  uuid references public.borrowings(id) on delete set null,
  user_id       uuid references public.profiles(id) on delete set null,
  amount        numeric(10,2) not null,
  currency      text not null default 'USD',
  method        text not null default 'cash',
  receipt_no    text not null,
  collected_by  uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);

create index if not exists fine_payments_user_idx on public.fine_payments (user_id);

alter table public.fine_payments enable row level security;
create policy "Users read own fine payments"
  on public.fine_payments for select
  using (auth.uid() = user_id or public.is_staff());
create policy "Staff manage fine payments"
  on public.fine_payments for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Performance indexes for the overdue report ───────────────────────────────
create index if not exists borrowings_due_status_idx
  on public.borrowings (due_date, status);
create index if not exists profiles_dept_year_idx
  on public.profiles (department, academic_year, semester);

-- ── Overdue report (server-side filtered + paginated) ────────────────────────
--  "Overdue" = due_date < now() and not yet returned (status active|overdue).
create or replace function public.get_overdue_report(
  p_search       text   default '',
  p_department   text   default null,
  p_year         int    default null,
  p_semester     text   default null,
  p_category     text   default null,
  p_min_days     int    default null,
  p_max_days     int    default null,
  p_min_fine     numeric default null,
  p_max_fine     numeric default null,
  p_only_overdue boolean default false,
  p_limit        int    default 50,
  p_offset       int    default 0
)
returns table (
  borrowing_id uuid,
  user_id      uuid,
  full_name    text,
  student_id   text,
  department   text,
  academic_year int,
  semester     text,
  book_title   text,
  book_id      text,
  issue_date   timestamptz,
  due_date     timestamptz,
  overdue_days int,
  fine_amount  numeric,
  status       text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    b.id,
    b.user_id,
    p.full_name,
    p.student_id,
    p.department,
    p.academic_year,
    p.semester,
    book.title,
    bc.barcode,
    b.issue_date,
    b.due_date,
    floor(extract(epoch from (now() - b.due_date)) / 86400)::int,
    b.fine_amount,
    b.status
  from borrowings b
  join profiles p on p.id = b.user_id
  join book_copies bc on bc.id = b.copy_id
  join books book on book.id = bc.book_id
  where b.status in ('active', 'overdue')
    and (p_only_overdue = false or b.due_date < now())
    and (
      p_search = '' or
      p.full_name ilike '%' || p_search || '%' or
      p.student_id ilike '%' || p_search || '%' or
      book.title ilike '%' || p_search || '%' or
      bc.barcode ilike '%' || p_search || '%'
    )
    and (p_department is null or p.department = p_department)
    and (p_year is null or p.academic_year = p_year)
    and (p_semester is null or p.semester = p_semester)
    and (
      p_category is null or exists (
        select 1 from book_categories bc2
        join categories c on c.id = bc2.category_id
        where bc2.book_id = book.id and c.name = p_category
      )
    )
    and (
      p_min_days is null or
      greatest(0, floor(extract(epoch from (now() - b.due_date)) / 86400))::int >= p_min_days
    )
    and (
      p_max_days is null or
      greatest(0, floor(extract(epoch from (now() - b.due_date)) / 86400))::int <= p_max_days
    )
    and (p_min_fine is null or b.fine_amount >= p_min_fine)
    and (p_max_fine is null or b.fine_amount <= p_max_fine)
  order by b.due_date asc
  limit p_limit offset p_offset
$$;

-- ── Overdue summary metrics ───────────────────────────────────────────────────
create or replace function public.get_overdue_summary()
returns table (
  total_overdue_books        int,
  total_overdue_students     int,
  total_fine_collected       numeric,
  total_pending_fine         numeric,
  highest_fine               numeric,
  books_due_today            int,
  books_overdue_this_week    int,
  recently_returned_overdue  int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*)::int from borrowings where status in ('active','overdue') and due_date < now()),
    (select count(distinct user_id)::int from borrowings where status in ('active','overdue') and due_date < now()),
    (select coalesce(sum(amount), 0)::numeric from fine_payments),
    (select coalesce(sum(fine_amount), 0)::numeric from borrowings where status in ('active','overdue')),
    (select coalesce(max(fine_amount), 0)::numeric from borrowings where status in ('active','overdue') and due_date < now()),
    (select count(*)::int from borrowings where status in ('active','overdue') and date(due_date) = date(now())),
    (select count(*)::int from borrowings where status in ('active','overdue') and due_date < now() and due_date >= now() - interval '7 days'),
    (select count(*)::int from borrowings where status = 'returned' and return_date >= now() - interval '7 days' and due_date < return_date)
$$;

-- ── Collect a fine (records payment + reduces outstanding balance) ───────────
create or replace function public.collect_fine(
  p_borrowing_id uuid,
  p_amount       numeric,
  p_method       text default 'cash',
  p_collected_by uuid default null
)
returns table (payment_id uuid, receipt_no text, currency text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user   uuid;
  v_cur    text;
  v_receipt text;
  v_id     uuid;
begin
  select user_id into v_user from borrowings where id = p_borrowing_id;
  select currency into v_cur from fine_settings where id = 1;
  v_receipt := 'FR-' || to_char(now(), 'YYYYMMDD') || '-' || substr(p_borrowing_id::text, 1, 6);

  insert into fine_payments (borrowing_id, user_id, amount, currency, method, receipt_no, collected_by)
  values (p_borrowing_id, v_user, p_amount, v_cur, p_method, v_receipt, p_collected_by)
  returning id into v_id;

  update borrowings
    set fine_amount = greatest(0, fine_amount - p_amount), updated_at = now()
    where id = p_borrowing_id;

  return query select v_id, v_receipt, v_cur;
end;
$$;

-- ── Record a reminder (in-app by default; external channels dispatched by the
--    send-reminders edge function when providers are configured) ──────────────
create or replace function public.send_reminder(
  p_borrowing_id uuid,
  p_kind         text,
  p_channel      text default 'in_app',
  p_message      text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid;
  v_id   uuid;
begin
  select user_id into v_user from borrowings where id = p_borrowing_id;
  insert into reminders (user_id, borrowing_id, kind, channel, message)
  values (v_user, p_borrowing_id, p_kind, p_channel, p_message)
  returning id into v_id;
  return v_id;
end;
$$;

-- ── Automated due-date / overdue reminders (requirement 9) ───────────────────
-- Runs daily via pg_cron. Inserts in-app reminders:
--   • 3 days before the due date  → 'pre_due'
--   • on the due date             → 'due'
--   • every day once overdue      → 'overdue_daily'
-- Returned books are excluded automatically (status not in active|overdue),
-- so notifications stop the moment a book is returned. Idempotent per
-- borrowing / kind / day.
create or replace function public.generate_due_reminders()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  rec    record;
  v_days int;
  v_kind text;
  v_count int := 0;
begin
  for rec in
    select b.id, b.user_id, b.due_date, book.title as book_title
    from borrowings b
    join book_copies bc on bc.id = b.copy_id
    join books book on book.id = bc.book_id
    where b.status in ('active', 'overdue')
  loop
    v_days := floor(extract(epoch from (now() - rec.due_date)) / 86400)::int;
    if v_days = -3 then v_kind := 'pre_due';
    elsif v_days = 0 then v_kind := 'due';
    elsif v_days > 0 then v_kind := 'overdue_daily';
    else continue;
    end if;

    if not exists (
      select 1 from reminders
      where borrowing_id = rec.id and kind = v_kind and channel = 'in_app'
        and date(sent_at) = date(now())
    ) then
      insert into reminders (user_id, borrowing_id, kind, channel, message)
      values (
        rec.user_id, rec.id, v_kind, 'in_app',
        'Reminder: "' || rec.book_title || '" is ' ||
          case when v_kind = 'overdue_daily' then 'overdue'
               when v_kind = 'due' then 'due today'
               else 'due in 3 days' end || '.'
      );
      v_count := v_count + 1;
    end if;
  end loop;
  return v_count;
end;
$$;

-- Schedule the reminder job daily (after the 02:00 fine accrual).
create extension if not exists pg_cron;
select cron.unschedule('generate-due-reminders')
where exists (select 1 from cron.job where jobname = 'generate-due-reminders');
select cron.schedule(
  'generate-due-reminders',
  '0 6 * * *',
  $$ select public.generate_due_reminders(); $$
);
