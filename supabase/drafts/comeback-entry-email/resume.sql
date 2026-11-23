-- Resume a paused installation after checking the sending configuration.
-- Restore intake and RPCs. Activate the two named schedules separately.
begin;
alter table public.raffle_entries enable trigger raffle_entry_confirmation_queue;
grant execute on function public.claim_raffle_entry_confirmations(uuid) to service_role;
grant execute on function public.finish_raffle_entry_confirmation(uuid,uuid,text,boolean,text) to service_role;
commit;
