-- Read only; never returns secrets or customer data.
select jsonb_build_object(
 'target_database',current_database(),
 'queue_absent',to_regclass('private.raffle_entry_confirmation_jobs') is null,
 'raffles_present',to_regclass('public.raffles') is not null,
 'entries_present',to_regclass('public.raffle_entries') is not null,
 'extensions',(select jsonb_agg(extname) from pg_extension where extname in ('pg_cron','supabase_vault','pg_net')),
 'conflicting_jobs',(select count(*) from cron.job where jobname in ('commerce-raffle-lifecycle','commerce-raffle-confirmation-retry')),
 'conflicting_functions',(select count(*) from pg_proc where proname in ('claim_raffle_entry_confirmations','finish_raffle_entry_confirmation','advance_scheduled_raffles','invoke_raffle_email_worker'))
);
