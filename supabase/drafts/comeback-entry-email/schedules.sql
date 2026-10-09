-- REVIEW ONLY. Requires pg_cron and Vault already installed; pg_net is new.
-- No credentials in job definitions. Both jobs start INACTIVE.
begin;
create extension if not exists pg_net with schema extensions;
create function private.invoke_raffle_email_worker() returns bigint
language plpgsql security definer set search_path='' set statement_timeout='5s' as $$
declare worker_secret text;
begin
 select decrypted_secret into worker_secret from vault.decrypted_secrets where name='raffle_email_worker_secret';
 if worker_secret is null or length(worker_secret)<32 then return null; end if;
 return net.http_get(
  url:='https://luminalfactory.com/api/internal/raffle-entry-email',
  headers:=jsonb_build_object('Authorization','Bearer '||worker_secret),
  timeout_milliseconds:=30000
 );
end; $$;
revoke all on function private.invoke_raffle_email_worker() from public,anon,authenticated,service_role;
select cron.schedule('commerce-raffle-lifecycle','* * * * *','select private.advance_scheduled_raffles();');
select cron.schedule('commerce-raffle-confirmation-retry','*/2 * * * *','select private.invoke_raffle_email_worker();');
update cron.job set active=false where jobname in ('commerce-raffle-lifecycle','commerce-raffle-confirmation-retry');
commit;
