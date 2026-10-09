-- REVIEW ONLY. Keeps canonical status in the database; no client clock transitions.
begin;
create function private.advance_scheduled_raffles() returns integer
language plpgsql security definer set search_path='' set statement_timeout='5s' set lock_timeout='2s' as $$
declare changed integer;
begin
 update public.raffles r
 set status=case when r.closes_at<=statement_timestamp() then 'CLOSED' else 'OPEN' end,
     updated_at=statement_timestamp()
 where r.is_published and not r.is_test and r.published_at<=statement_timestamp()
   and r.opens_at is not null and r.closes_at>r.opens_at
   and ((r.status='SCHEDULED' and r.opens_at<=statement_timestamp())
     or (r.status='OPEN' and r.closes_at<=statement_timestamp()));
 get diagnostics changed=row_count;
 return changed;
end; $$;
revoke all on function private.advance_scheduled_raffles() from public,anon,authenticated,service_role;
commit;
