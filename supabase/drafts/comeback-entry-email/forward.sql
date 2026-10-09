-- REVIEW PACKAGE: applies only after owner approval. No old entries are emailed.
begin;
create table private.raffle_entry_confirmation_jobs (
 entry_id uuid primary key references public.raffle_entries(id) on delete restrict,
 payload jsonb not null,
 state text not null default 'pending' check(state in ('pending','sending','sent','failed')),
 attempts integer not null default 0 check(attempts between 0 and 5),
 created_at timestamptz not null default clock_timestamp(),
 next_attempt_at timestamptz not null default clock_timestamp(),
 lease_until timestamptz, lease_token uuid, provider_id text,
 failure_code text check(failure_code is null or length(failure_code)<=64),
 sent_at timestamptz,
 check(octet_length(payload::text)<=4096)
);
create index raffle_confirmation_pending_idx on private.raffle_entry_confirmation_jobs(next_attempt_at) where state in ('pending','sending');
alter table private.raffle_entry_confirmation_jobs enable row level security;
revoke all on private.raffle_entry_confirmation_jobs from public,anon,authenticated,service_role;

create function private.queue_raffle_entry_confirmation() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 insert into private.raffle_entry_confirmation_jobs(entry_id,payload)
 select NEW.id,jsonb_build_object('entryId',NEW.id,'email',NEW.contact_email,'displayName',NEW.display_name,'title',r.title,'slug',r.slug)
 from public.raffles r where r.id=NEW.raffle_id and not r.is_test
 on conflict(entry_id) do nothing;
 return NEW;
end; $$;
revoke all on function private.queue_raffle_entry_confirmation() from public,anon,authenticated,service_role;
create trigger raffle_entry_confirmation_queue after insert on public.raffle_entries for each row execute function private.queue_raffle_entry_confirmation();

create function public.claim_raffle_entry_confirmations(p_entry_id uuid default null)
returns table(entry_id uuid,lease_token uuid,payload jsonb,attempts integer)
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
begin
 update private.raffle_entry_confirmation_jobs j set state='failed',failure_code=case when j.attempts>=5 then 'attempts_exhausted' else 'retry_window_expired' end,lease_token=null,lease_until=null
 where j.state in ('pending','sending') and (j.created_at < clock_timestamp()-interval '23 hours' or j.attempts>=5)
 and (j.lease_until is null or j.lease_until<clock_timestamp());
 return query
 with candidate as (
  select j.entry_id from private.raffle_entry_confirmation_jobs j
  where (p_entry_id is null or j.entry_id=p_entry_id) and j.attempts<5
   and j.created_at>=clock_timestamp()-interval '23 hours'
   and ((j.state='pending' and j.next_attempt_at<=clock_timestamp()) or (j.state='sending' and j.lease_until<clock_timestamp()))
  order by j.next_attempt_at for update skip locked limit 1
 ), claimed as (
  update private.raffle_entry_confirmation_jobs j set state='sending',attempts=j.attempts+1,
    lease_token=gen_random_uuid(),lease_until=clock_timestamp()+interval '2 minutes'
  from candidate c where j.entry_id=c.entry_id returning j.entry_id,j.lease_token,j.payload,j.attempts
 ) select c.entry_id,c.lease_token,c.payload,c.attempts from claimed c;
end; $$;

create function public.finish_raffle_entry_confirmation(p_entry_id uuid,p_lease_token uuid,p_provider_id text,p_retryable boolean,p_failure_code text)
returns boolean language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare changed integer;
begin
 if p_failure_code is not null and p_failure_code !~ '^[a-z0-9_]{1,64}$' then raise exception 'invalid failure code' using errcode='22023'; end if;
 if p_provider_id is not null and (length(p_provider_id)>128 or length(p_provider_id)=0) then raise exception 'invalid provider id' using errcode='22023'; end if;
 update private.raffle_entry_confirmation_jobs j
 set state=case when p_provider_id is not null then 'sent' when p_retryable and j.attempts<5 then 'pending' else 'failed' end,
 provider_id=p_provider_id,sent_at=case when p_provider_id is not null then clock_timestamp() else null end,
 failure_code=case when p_provider_id is not null then null else p_failure_code end,
 next_attempt_at=clock_timestamp()+make_interval(secs=>power(2,j.attempts)::integer*60),lease_until=null,lease_token=null
 where j.entry_id=p_entry_id and j.lease_token=p_lease_token and j.state='sending';
 get diagnostics changed=row_count;
 return changed=1;
end; $$;
revoke all on function public.claim_raffle_entry_confirmations(uuid) from public,anon,authenticated;
revoke all on function public.finish_raffle_entry_confirmation(uuid,uuid,text,boolean,text) from public,anon,authenticated;
grant execute on function public.claim_raffle_entry_confirmations(uuid) to service_role;
grant execute on function public.finish_raffle_entry_confirmation(uuid,uuid,text,boolean,text) to service_role;
commit;
