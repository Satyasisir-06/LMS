-- Athenaeum — Phase 3 follow-up: automate overdue-fine accrual.
--
-- The `apply_overdue_fines()` RPC already exists and is SECURITY DEFINER
-- (bypasses RLS), so we can drive it directly from pg_cron without exposing
-- the service-role key or depending on the Edge Function being deployed.
-- This replaces the manual "Recalculate overdue fines" button as the system
-- of record, running daily at 02:00.

create extension if not exists pg_cron;

-- Remove any prior schedule so re-running this migration is idempotent.
select cron.unschedule('apply-overdue-fines')
where exists (
  select 1 from cron.job where jobname = 'apply-overdue-fines'
);

select cron.schedule(
  'apply-overdue-fines',
  '0 2 * * *',
  $$ select public.apply_overdue_fines(); $$
);
