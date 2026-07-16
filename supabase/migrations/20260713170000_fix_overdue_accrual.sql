-- ============================================================================
--  Athenaeum — Fix: Continuous Overdue Fine Accrual
-- ============================================================================
--  Corrects the apply_overdue_fines routine so that it queries both 'active'
--  and 'overdue' borrowings that have not been returned yet (return_date is null),
--  ensuring late fees continue to accrue daily instead of stopping on the first run.
-- ============================================================================

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
     where status in ('active', 'overdue')
       and due_date < now()
       and return_date is null
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
