-- Phase 6 Slice C hardening for saved customer addresses.
-- Keeps the capability default-off at runtime; this migration only tightens database ownership and invariants.

-- Authenticated callers may resolve only their own customer identifier.
grant select (id, auth_user_id) on table public.customers to authenticated;

create policy customers_select_own_identifier
on public.customers
for select
to authenticated
using (auth_user_id = (select auth.uid()));

create or replace function public.commerce_customer_address_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  address_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.customer_id::text, 0));

  if tg_op = 'INSERT' then
    select count(*)::integer
      into address_count
      from public.customer_addresses
     where customer_id = new.customer_id;

    if address_count >= 10 then
      raise exception 'customer address limit reached' using errcode = '23514';
    end if;

    if address_count = 0 then
      new.is_default := true;
    end if;
  end if;

  if new.is_default then
    update public.customer_addresses
       set is_default = false
     where customer_id = new.customer_id
       and id is distinct from new.id
       and is_default;
  end if;

  return new;
end;
$$;

create trigger customer_addresses_guard
before insert or update of customer_id, is_default on public.customer_addresses
for each row execute function public.commerce_customer_address_guard();

create or replace function public.commerce_customer_address_reassign_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_default then
    perform pg_advisory_xact_lock(hashtextextended(old.customer_id::text, 0));

    update public.customer_addresses
       set is_default = true
     where id = (
       select id
         from public.customer_addresses
        where customer_id = old.customer_id
        order by created_at asc, id asc
        limit 1
     );
  end if;

  return old;
end;
$$;

create trigger customer_addresses_reassign_default
after delete on public.customer_addresses
for each row execute function public.commerce_customer_address_reassign_default();

revoke all on function public.commerce_customer_address_guard() from public, anon, authenticated;
revoke all on function public.commerce_customer_address_reassign_default() from public, anon, authenticated;
grant execute on function public.commerce_customer_address_guard() to service_role;
grant execute on function public.commerce_customer_address_reassign_default() to service_role;
