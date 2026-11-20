begin;

create table public.raffle_shipping_rates (
  raffle_id uuid not null references public.raffles(id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  carrier_minor integer not null check (carrier_minor between 0 and 1000000),
  covered_minor integer not null check (covered_minor between 0 and 1000000),
  customer_minor integer generated always as (
    case when country_code = 'VN' then 0 else greatest(carrier_minor - covered_minor, 0) end
  ) stored,
  primary key (raffle_id, country_code)
);

alter table public.raffle_shipping_rates enable row level security;
revoke all on public.raffle_shipping_rates from public, anon, authenticated;
grant select (raffle_id, country_code, customer_minor) on public.raffle_shipping_rates to anon, authenticated;
grant select, insert, update on public.raffle_shipping_rates to service_role;
create policy raffle_shipping_rates_read_published on public.raffle_shipping_rates
  for select to anon, authenticated using (
    exists (
      select 1 from public.raffles as raffle
      where raffle.id = raffle_shipping_rates.raffle_id and raffle.is_published
        and not raffle.is_test and raffle.status <> 'DRAFT' and raffle.published_at <= now()
    )
  );

create table private.raffle_order_shipping_quotes (
  order_id uuid primary key references public.orders(id) on delete restrict,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  carrier_minor integer not null check (carrier_minor between 0 and 1000000),
  covered_minor integer not null check (covered_minor between 0 and carrier_minor)
);

alter table private.raffle_order_shipping_quotes enable row level security;
revoke all on private.raffle_order_shipping_quotes from public, anon, authenticated;
grant select, insert on private.raffle_order_shipping_quotes to service_role;

create function public.confirm_raffle_winner_with_shipping_quote(
  p_operation_id uuid, p_client_id text, p_raffle_id uuid, p_allocation_id uuid,
  p_actor_id text, p_request_fingerprint text, p_payload jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
set lock_timeout = '2s'
set statement_timeout = '8s'
as $function$
declare
  destination text;
  carrier integer;
  covered integer;
  saved_quote private.raffle_order_shipping_quotes%rowtype;
  result jsonb;
  confirmed_order_id uuid;
begin
  -- Serialize quote retries for this allocation before consulting mutable rates.
  perform 1 from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id;
  if not found then
    raise exception 'winner allocation not found' using errcode = 'P0002';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('raffle-shipping:' || p_allocation_id::text, 0));

  select upper(address.country_code) into destination
  from public.raffle_winner_allocations as allocation
  join private.raffle_entry_shipping_addresses as address
    on address.raffle_entry_id = allocation.raffle_entry_id
  where allocation.id = p_allocation_id and allocation.raffle_id = p_raffle_id;

  if destination is null then
    raise exception 'raffle shipping address is missing' using errcode = '22023';
  end if;

  select quote.* into saved_quote
  from public.raffle_winner_allocations as allocation
  join private.raffle_order_shipping_quotes as quote on quote.order_id = allocation.order_id
  where allocation.id = p_allocation_id and allocation.raffle_id = p_raffle_id;

  if found then
    carrier := saved_quote.carrier_minor;
    covered := saved_quote.covered_minor;
  elsif p_payload ? 'carrier_minor' then
    carrier := (p_payload->>'carrier_minor')::integer;
    covered := (p_payload->>'covered_minor')::integer;
  else
    select rate.carrier_minor, rate.covered_minor into carrier, covered
    from public.raffle_shipping_rates as rate
    where rate.raffle_id = p_raffle_id and rate.country_code = destination;
    if not found and destination = 'VN' then
      carrier := 0;
      covered := 0;
    end if;
  end if;

  if carrier is null or covered is null
    or carrier not between 0 and 1000000 or covered not between 0 and 1000000 then
    raise exception 'a confirmed shipping rate is required' using errcode = '22023';
  end if;

  covered := case when destination = 'VN' then carrier else least(covered, carrier) end;
  result := public.manage_raffle_winner_allocation(
    p_operation_id, p_client_id, 'confirm', p_raffle_id, p_allocation_id, null,
    p_actor_id, p_request_fingerprint,
    p_payload || jsonb_build_object('shipping_minor', carrier - covered)
  );

  if result#>>'{order,currency}' is distinct from 'USD' then
    raise exception 'shipping rates require a USD order' using errcode = '22023';
  end if;

  confirmed_order_id := (result#>>'{order,id}')::uuid;
  if (result#>>'{order,shipping_minor}')::integer is distinct from carrier - covered then
    raise exception 'shipping quote does not match saved order' using errcode = '22023';
  end if;

  insert into private.raffle_order_shipping_quotes
    (order_id, country_code, carrier_minor, covered_minor)
  values (confirmed_order_id, destination, carrier, covered)
  on conflict on constraint raffle_order_shipping_quotes_pkey do nothing;

  return result;
end;
$function$;

revoke execute on function public.confirm_raffle_winner_with_shipping_quote(uuid,text,uuid,uuid,text,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.confirm_raffle_winner_with_shipping_quote(uuid,text,uuid,uuid,text,text,jsonb)
  to service_role;

commit;
