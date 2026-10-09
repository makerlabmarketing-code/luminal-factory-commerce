-- Read only, no PII or credential values in results.
select jsonb_build_object(
 'queue_rls',(select relrowsecurity from pg_class where oid='private.raffle_entry_confirmation_jobs'::regclass),
 'anon_claim_denied',not has_function_privilege('anon','public.claim_raffle_entry_confirmations(uuid)','execute'),
 'authenticated_claim_denied',not has_function_privilege('authenticated','public.claim_raffle_entry_confirmations(uuid)','execute'),
 'service_claim_allowed',has_function_privilege('service_role','public.claim_raffle_entry_confirmations(uuid)','execute'),
 'anon_queue_denied',not has_table_privilege('anon','private.raffle_entry_confirmation_jobs','select'),
 'jobs',(select jsonb_agg(jsonb_build_object('name',jobname,'active',active,'schedule',schedule)) from cron.job where jobname in ('commerce-raffle-lifecycle','commerce-raffle-confirmation-retry')),
 'queue_states',(select jsonb_object_agg(state,n) from (select state,count(*) n from private.raffle_entry_confirmation_jobs group by state) s)
);
