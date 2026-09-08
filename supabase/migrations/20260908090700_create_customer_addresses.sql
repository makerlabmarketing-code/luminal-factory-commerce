-- Phase 6 Slice C: customer-owned saved addresses.
-- This migration is schema-only until explicitly approved for Production.
-- It does not open order, payment, inventory, raffle or ERP write access.

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null,
  recipient_name text not null,
  phone text not null,
  country_code char(2) not null default 'VN',
  administrative_area text not null,
  locality text not null,
  address_line1 text not null,
  address_line2 text,
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint customer_addresses_label_check
    check (length(btrim(label)) between 1 and 40),
  constraint customer_addresses_recipient_name_check
    check (length(btrim(recipient_name)) between 1 and 120),
  constraint customer_addresses_phone_check
    check (length(btrim(phone)) between 3 and 32),
  constraint customer_addresses_country_code_check
    check (country_code = upper(country_code) and country_code ~ '^[A-Z]{2}$'),
  constraint customer_addresses_administrative_area_check
    check (length(btrim(administrative_area)) between 1 and 120),
  constraint customer_addresses_locality_check
    check (length(btrim(locality)) between 1 and 120),
  constraint customer_addresses_address_line1_check
    check (length(btrim(address_line1)) between 1 and 200),
  constraint customer_addresses_address_line2_check
    check (address_line2 is null or length(btrim(address_line2)) between 1 and 200),
  constraint customer_addresses_postal_code_check
    check (postal_code is null or length(btrim(postal_code)) between 1 and 32)
);

create index customer_addresses_customer_idx
  on public.customer_addresses(customer_id);

create unique index customer_addresses_one_default_per_customer_uidx
  on public.customer_addresses(customer_id)
  where is_default;

create trigger customer_addresses_set_updated_at
before update on public.customer_addresses
for each row execute function public.commerce_set_updated_at();

alter table public.customer_addresses enable row level security;

revoke all on table public.customer_addresses from public, anon, authenticated;
grant select, insert, update, delete on table public.customer_addresses to authenticated;
grant all on table public.customer_addresses to service_role;

create policy customer_addresses_select_own
on public.customer_addresses
for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy customer_addresses_insert_own
on public.customer_addresses
for insert
to authenticated
with check (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy customer_addresses_update_own
on public.customer_addresses
for update
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

create policy customer_addresses_delete_own
on public.customer_addresses
for delete
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);
