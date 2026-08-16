-- Phase 6 Slice A: server-mediated guest cart persistence.
-- This migration contains no customer PII, Auth policy, order creation,
-- inventory reservation, payment behavior or direct browser access.

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  guest_token_hash bytea,
  status text not null default 'active'
    check (status in ('active', 'converted', 'expired', 'abandoned')),
  currency char(3) not null default 'VND'
    check (currency = 'VND'),
  expires_at timestamptz not null default (now() + interval '30 days'),
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint carts_guest_token_hash_length_check
    check (guest_token_hash is null or octet_length(guest_token_hash) = 32),
  constraint carts_owner_mode_check
    check (
      (
        status = 'active'
        and ((customer_id is null) <> (guest_token_hash is null))
      )
      or (
        status <> 'active'
        and guest_token_hash is null
      )
    ),
  constraint carts_expiry_check check (expires_at > created_at)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  requested_quantity integer not null
    check (requested_quantity between 1 and 99),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index carts_guest_token_hash_uidx
  on public.carts(guest_token_hash)
  where guest_token_hash is not null;

create unique index carts_active_customer_uidx
  on public.carts(customer_id)
  where customer_id is not null and status = 'active';

create index carts_status_expiry_idx
  on public.carts(status, expires_at);

create unique index cart_items_cart_variant_uidx
  on public.cart_items(cart_id, variant_id)
  where variant_id is not null;

create unique index cart_items_cart_product_no_variant_uidx
  on public.cart_items(cart_id, product_id)
  where variant_id is null;

create index cart_items_product_idx on public.cart_items(product_id);
create index cart_items_variant_idx on public.cart_items(variant_id);

create trigger carts_set_updated_at before update on public.carts
for each row execute function public.commerce_set_updated_at();

create trigger cart_items_set_updated_at before update on public.cart_items
for each row execute function public.commerce_set_updated_at();

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Guest carts are reachable only through the validated storefront server.
-- No RLS policy is intentional: client roles remain default-deny.
revoke all on table public.carts, public.cart_items from public, anon, authenticated;
grant select, insert, update, delete on table public.carts, public.cart_items to service_role;
