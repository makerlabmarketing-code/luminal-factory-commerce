-- Turn off COMMERCE_RAFFLE_CONFIRMATION_ENABLED before pausing database work.
-- Preserve entries, shipping addresses, confirmation evidence and job history.
begin;
select cron.alter_job(jobid, active := false)
from cron.job
where jobname in ('commerce-raffle-lifecycle','commerce-raffle-confirmation-retry') and active;
alter table public.raffle_entries disable trigger raffle_entry_confirmation_queue;
revoke execute on function public.claim_raffle_entry_confirmations(uuid) from service_role;
revoke execute on function public.finish_raffle_entry_confirmation(uuid,uuid,text,boolean,text) from service_role;
commit;
