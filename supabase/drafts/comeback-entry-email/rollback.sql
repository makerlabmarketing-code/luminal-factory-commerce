-- Stop COMMERCE_RAFFLE_CONFIRMATION_ENABLED and the worker schedule first.
-- Preserve existing entries, shipping addresses and confirmation-job evidence.
begin;
select cron.unschedule(jobid) from cron.job where jobname in ('commerce-raffle-lifecycle','commerce-raffle-confirmation-retry');
drop function if exists private.invoke_raffle_email_worker();
drop function if exists private.advance_scheduled_raffles();
drop trigger if exists raffle_entry_confirmation_queue on public.raffle_entries;
revoke execute on function public.claim_raffle_entry_confirmations(uuid) from service_role;
revoke execute on function public.finish_raffle_entry_confirmation(uuid,uuid,text,boolean,text) from service_role;
commit;
