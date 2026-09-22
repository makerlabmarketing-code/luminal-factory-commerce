-- Approved by RAFFLE-ERP-SCHEMA-01 on 2026-09-22.
-- Raffle shipping PII + private-test + winner-allocation persistence foundation.

alter table public.raffles
  add column is_test boolean not null default false,
  add column variant_id uuid references public.product_variants(id) on delete restrict,
  add column results_published_at timestamptz;

create index raffles_variant_id_idx on public.raffles(variant_id)
  where variant_id is not null;

drop policy if exists "Public can read published raffles" on public.raffles;
create policy "Public can read published raffles"
on public.raffles
for select
to anon, authenticated
using (
  not is_test
  and is_published
  and published_at is not null
  and published_at <= statement_timestamp()
);

create table private.raffle_entry_shipping_addresses (
  raffle_entry_id uuid primary key references public.raffle_entries(id) on delete cascade,
  recipient_name text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_province text not null,
  postal_code text,
  country_code char(2) not null,
  phone text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint raffle_entry_shipping_recipient_check
    check (length(btrim(recipient_name)) between 2 and 120),
  constraint raffle_entry_shipping_line1_check
    check (length(btrim(address_line_1)) between 3 and 240),
  constraint raffle_entry_shipping_line2_check
    check (address_line_2 is null or length(btrim(address_line_2)) between 1 and 240),
  constraint raffle_entry_shipping_city_check
    check (length(btrim(city)) between 1 and 120),
  constraint raffle_entry_shipping_state_check
    check (length(btrim(state_province)) between 1 and 120),
  constraint raffle_entry_shipping_postal_check
    check (postal_code is null or length(btrim(postal_code)) between 1 and 32),
  constraint raffle_entry_shipping_country_check
    check (country_code = upper(country_code) and country_code ~ '^[A-Z]{2}$'),
  constraint raffle_entry_shipping_phone_check
    check (phone is null or length(btrim(phone)) between 5 and 32)
);

alter table private.raffle_entry_shipping_addresses enable row level security;
revoke all on table private.raffle_entry_shipping_addresses from public, anon, authenticated;
grant select, insert, update, delete on table private.raffle_entry_shipping_addresses to service_role;

create table public.raffle_winner_allocations (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete restrict,
  raffle_entry_id uuid not null references public.raffle_entries(id) on delete restrict,
  allocation_sequence integer not null check (allocation_sequence > 0),
  public_code text not null default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  status text not null default 'SELECTED'
    check (status in (
      'SELECTED',
      'CONFIRMED',
      'PAYMENT_PENDING',
      'PAID',
      'FULFILLING',
      'COMPLETED',
      'CANCELLED',
      'REALLOCATED'
    )),
  payment_deadline_at timestamptz,
  fulfillment_due_at timestamptz,
  order_id uuid unique references public.orders(id) on delete restrict,
  selected_at timestamptz not null default statement_timestamp(),
  confirmed_at timestamptz,
  paid_at timestamptz,
  cancelled_at timestamptz,
  completed_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint raffle_winner_allocation_raffle_entry_key unique (raffle_id, raffle_entry_id),
  constraint raffle_winner_allocation_sequence_key unique (raffle_id, allocation_sequence),
  constraint raffle_winner_allocation_public_code_key unique (public_code),
  constraint raffle_winner_allocation_deadline_check
    check (
      status not in ('PAYMENT_PENDING')
      or payment_deadline_at is not null
    ),
  constraint raffle_winner_allocation_cancel_reason_check
    check (
      cancellation_reason is null
      or length(btrim(cancellation_reason)) between 3 and 500
    )
);

create index raffle_winner_allocations_raffle_status_idx
  on public.raffle_winner_allocations(raffle_id, status, allocation_sequence);

create trigger raffle_winner_allocations_set_updated_at
before update on public.raffle_winner_allocations
for each row execute function public.commerce_set_updated_at();

alter table public.raffle_winner_allocations enable row level security;
revoke all on table public.raffle_winner_allocations from public, anon, authenticated;
grant select, insert, update on table public.raffle_winner_allocations to service_role;

create table public.raffle_winner_allocation_events (
  id uuid primary key default gen_random_uuid(),
  allocation_id uuid not null references public.raffle_winner_allocations(id) on delete restrict,
  raffle_id uuid not null references public.raffles(id) on delete restrict,
  event_type text not null,
  from_status text,
  to_status text,
  actor_id text not null,
  request_id uuid not null,
  note text,
  created_at timestamptz not null default statement_timestamp(),
  constraint raffle_winner_allocation_events_request_key unique (request_id, event_type)
);

create index raffle_winner_allocation_events_allocation_idx
  on public.raffle_winner_allocation_events(allocation_id, created_at);

alter table public.raffle_winner_allocation_events enable row level security;
revoke all on table public.raffle_winner_allocation_events from public, anon, authenticated;
grant select, insert on table public.raffle_winner_allocation_events to service_role;

create table private.order_shipping_addresses (
  order_id uuid primary key references public.orders(id) on delete restrict,
  recipient_name text not null,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state_province text not null,
  postal_code text,
  country_code char(2) not null,
  phone text,
  created_at timestamptz not null default statement_timestamp(),
  constraint order_shipping_country_check
    check (country_code = upper(country_code) and country_code ~ '^[A-Z]{2}$')
);

alter table private.order_shipping_addresses enable row level security;
revoke all on table private.order_shipping_addresses from public, anon, authenticated;
grant select, insert, update on table private.order_shipping_addresses to service_role;

create function public.submit_guest_raffle_entry_v2(
  p_raffle_id uuid,
  p_email text,
  p_display_name text,
  p_rules_version text,
  p_request_token_hash text,
  p_request_fingerprint_hash text,
  p_recipient_name text,
  p_address_line_1 text,
  p_address_line_2 text,
  p_city text,
  p_state_province text,
  p_postal_code text,
  p_country_code text,
  p_phone text
)
returns table (
  entry_state text,
  entry_reference uuid
)
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  v_result record;
  v_country_code text := upper(btrim(p_country_code));
begin
  if p_recipient_name is null
    or length(btrim(p_recipient_name)) not between 2 and 120
    or p_address_line_1 is null
    or length(btrim(p_address_line_1)) not between 3 and 240
    or p_city is null
    or length(btrim(p_city)) not between 1 and 120
    or p_state_province is null
    or length(btrim(p_state_province)) not between 1 and 120
    or p_country_code is null
    or v_country_code !~ '^[A-Z]{2}
    or (p_address_line_2 is not null and length(btrim(p_address_line_2)) not between 1 and 240)
    or (p_postal_code is not null and length(btrim(p_postal_code)) not between 1 and 32)
    or (p_phone is not null and length(btrim(p_phone)) not between 5 and 32)
  then
    raise exception 'invalid raffle shipping input' using errcode = '22023';
  end if;

  select *
  into v_result
  from public.submit_guest_raffle_entry(
    p_raffle_id,
    p_email,
    p_display_name,
    p_rules_version,
    p_request_token_hash,
    p_request_fingerprint_hash
  );

  if v_result.entry_state = 'submitted' and v_result.entry_reference is not null then
    insert into private.raffle_entry_shipping_addresses (
      raffle_entry_id,
      recipient_name,
      address_line_1,
      address_line_2,
      city,
      state_province,
      postal_code,
      country_code,
      phone
    ) values (
      v_result.entry_reference,
      btrim(p_recipient_name),
      btrim(p_address_line_1),
      nullif(btrim(p_address_line_2), ''),
      btrim(p_city),
      btrim(p_state_province),
      nullif(btrim(p_postal_code), ''),
      v_country_code,
      nullif(btrim(p_phone), '')
    )
    on conflict (raffle_entry_id) do nothing;
  end if;

  return query select v_result.entry_state::text, v_result.entry_reference::uuid;
end;
$$;

revoke execute on function public.submit_guest_raffle_entry_v2(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.submit_guest_raffle_entry_v2(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) to service_role;

    or (p_address_line_2 is not null and length(btrim(p_address_line_2)) not between 1 and 240)
    or (p_postal_code is not null and length(btrim(p_postal_code)) not between 1 and 32)
    or (p_phone is not null and length(btrim(p_phone)) not between 5 and 32)
  then
    raise exception 'invalid raffle shipping input' using errcode = '22023';
  end if;

  select *
  into v_result
  from public.submit_guest_raffle_entry(
    p_raffle_id,
    p_email,
    p_display_name,
    p_rules_version,
    p_request_token_hash,
    p_request_fingerprint_hash
  );

  if v_result.entry_state = 'submitted' and v_result.entry_reference is not null then
    insert into private.raffle_entry_shipping_addresses (
      raffle_entry_id,
      recipient_name,
      address_line_1,
      address_line_2,
      city,
      state_province,
      postal_code,
      country_code,
      phone
    ) values (
      v_result.entry_reference,
      btrim(p_recipient_name),
      btrim(p_address_line_1),
      nullif(btrim(p_address_line_2), ''),
      btrim(p_city),
      btrim(p_state_province),
      nullif(btrim(p_postal_code), ''),
      v_country_code,
      nullif(btrim(p_phone), '')
    )
    on conflict (raffle_entry_id) do nothing;
  end if;

  return query select v_result.entry_state::text, v_result.entry_reference::uuid;
end;
$$;

revoke execute on function public.submit_guest_raffle_entry_v2(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.submit_guest_raffle_entry_v2(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
) to service_role;
