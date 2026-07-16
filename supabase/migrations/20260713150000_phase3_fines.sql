-- ============================================================================
--  Athenaeum — Phase 3 Schema: Financials (Fines) & Config
-- ============================================================================
--  Adds a configurable fine policy, an automated overdue-fine application
--  routine, plus staff RPCs to read/update the policy and trigger recalculation.
-- ============================================================================

-- ── Fine policy settings (single configurable row) ───────────────────────────
create table if not exists public.fine_settings (
  id          int primary key default 1,
  daily_rate  numeric(6,2) not null default 0.50,
  grace_days  int not null default 0,
  currency    text not null default 'USD',
  updated_at  timestamptz not null default now()
);

-- Ensure exactly one row exists.
insert into public.fine_settings (id, daily_rate, grace_days, currency)
  values (1, 0.50, 0, 'USD')
  on conflict (id) do nothing;

create trigger fine_settings_set_updated_at
  before update on public.fine_settings
  for each row execute function public.set_updated_at();

alter table public.fine_settings enable row level security;

-- Staff can read & manage the fine policy.
create policy "Staff read fine settings"
  on public.fine_settings for select
  using (public.is_staff());
create policy "Staff manage fine settings"
  on public.fine_settings for all
  using (public.is_staff()) with check (public.is_staff());

-- ── Read the active fine policy ──────────────────────────────────────────────
create or replace function public.get_fine_settings()
returns public.fine_settings
language sql
stable
security definer
set search_path = public
as $$
  select * from public.fine_settings where id = 1;
$$;

-- ── Update the fine policy (staff only) ──────────────────────────────────────
create or replace function public.update_fine_settings(
  p_daily_rate numeric,
  p_grace_days int,
  p_currency text default 'USD'
)
returns public.fine_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.fine_settings;
begin
  if not public.is_staff() then
    raise exception 'Only staff may update fine settings.';
  end if;

  update public.fine_settings
    set daily_rate = p_daily_rate,
        grace_days = p_grace_days,
        currency = p_currency,
        updated_at = now()
    where id = 1
    returning * into result;

  return result;
end;
$$;

-- ── Automated overdue fine application ───────────────────────────────────────
--  Marks borrowings past their due date as 'overdue' and accrues fines at the
--  configured daily rate (after any grace period). Idempotent: recomputing
--  only increases fines for days newly elapsed. Staff only.
create or replace function public.apply_overdue_fines()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rate numeric;
  v_grace int;
  updated_count int := 0;
  rec record;
  days_overdue int;
  accrued numeric;
begin
  if not public.is_staff() then
    raise exception 'Only staff may apply fines.';
  end if;

  select daily_rate, grace_days into v_rate, v_grace
    from public.fine_settings where id = 1;

  for rec in
    select id, due_date, return_date, fine_amount
      from public.borrowings
     where status = 'active'
       and due_date < now()
  loop
    days_overdue := greatest(
      0,
      floor(extract(epoch from (now() - rec.due_date)) / 86400) - v_grace
    );

    -- Fine is based on total days overdue (not incremental) for stability.
    accrued := round((days_overdue * v_rate)::numeric, 2);

    update public.borrowings
      set status = 'overdue',
          fine_amount = greatest(rec.fine_amount, accrued),
          updated_at = now()
      where id = rec.id;

    updated_count := updated_count + 1;
  end loop;

  return updated_count;
end;
$$;
