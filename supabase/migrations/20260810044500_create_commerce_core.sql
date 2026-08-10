-- Luminal Factory Commerce core schema
-- Dedicated project only: bkmbhcfokobmhfzgsfzh
-- Raffle scope is informational metadata only. No participation, winner, draw, or raffle-payment persistence.

create or replace function public.commerce_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  product_type text not null check (product_type in ('artisan_keycap', 'collectible_object', 'custom_object', 'other')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  release_type text not null default 'direct' check (release_type in ('direct', 'preorder', 'informational')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or published_at is not null)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  name text not null,
  attributes jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  currency char(3) not null default 'VND' check (currency = upper(currency)),
  amount_minor bigint not null check (amount_minor >= 0),
  compare_at_amount_minor bigint check (compare_at_amount_minor is null or compare_at_amount_minor >= amount_minor),
  active_from timestamptz,
  active_to timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (active_to is null or active_from is null or active_to > active_from)
);

create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete cascade,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0),
  updated_at timestamptz not null default now(),
  check (quantity_reserved <= quantity_on_hand)
);

create unique index inventory_items_product_no_variant_uidx
  on public.inventory_items(product_id)
  where variant_id is null;
create unique index inventory_items_variant_uidx
  on public.inventory_items(variant_id)
  where variant_id is not null;

create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  slug text not null unique,
  title text not null,
  description text,
  status text not null default 'upcoming' check (status in ('upcoming', 'open', 'closed', 'drawing', 'completed', 'unavailable')),
  opens_at timestamptz,
  closes_at timestamptz,
  timezone text not null default 'Asia/Ho_Chi_Minh',
  public_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (closes_at is null or opens_at is null or closes_at > opens_at)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  email text not null,
  full_name text,
  phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_email_normalized_uidx on public.customers (lower(email));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  customer_email_snapshot text not null,
  customer_name_snapshot text,
  currency char(3) not null default 'VND' check (currency = upper(currency)),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'fulfilled')),
  subtotal_minor bigint not null default 0 check (subtotal_minor >= 0),
  discount_minor bigint not null default 0 check (discount_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  grand_total_minor bigint not null default 0 check (grand_total_minor >= 0),
  notes text,
  placed_at timestamptz,
  cancelled_at timestamptz,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (grand_total_minor = subtotal_minor - discount_minor + shipping_minor + tax_minor),
  check (discount_minor <= subtotal_minor)
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text,
  sku_snapshot text,
  quantity integer not null check (quantity > 0),
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  line_total_minor bigint not null check (line_total_minor >= 0),
  created_at timestamptz not null default now(),
  check (line_total_minor = unit_price_minor * quantity)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null,
  provider_payment_id text,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'authorized', 'succeeded', 'failed', 'cancelled')),
  currency char(3) not null default 'VND' check (currency = upper(currency)),
  amount_minor bigint not null check (amount_minor >= 0),
  provider_fee_minor bigint not null default 0 check (provider_fee_minor >= 0),
  authorized_at timestamptz,
  succeeded_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id)
);

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete restrict,
  provider_refund_id text,
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'cancelled')),
  amount_minor bigint not null check (amount_minor > 0),
  reason text,
  succeeded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_refund_id)
);

create table public.commerce_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('order_paid', 'payment_refunded', 'order_cancelled')),
  aggregate_type text not null check (aggregate_type in ('order', 'payment', 'refund')),
  aggregate_id uuid not null,
  idempotency_key text not null unique,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants(product_id);
create index product_media_product_sort_idx on public.product_media(product_id, sort_order);
create index product_prices_product_active_idx on public.product_prices(product_id, is_active);
create index raffles_status_dates_idx on public.raffles(status, opens_at, closes_at);
create index orders_customer_created_idx on public.orders(customer_id, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index payments_order_status_idx on public.payments(order_id, status);
create index refunds_payment_status_idx on public.refunds(payment_id, status);
create index commerce_events_unprocessed_idx on public.commerce_events(occurred_at) where processed_at is null;

create trigger products_set_updated_at before update on public.products
for each row execute function public.commerce_set_updated_at();
create trigger product_variants_set_updated_at before update on public.product_variants
for each row execute function public.commerce_set_updated_at();
create trigger raffles_set_updated_at before update on public.raffles
for each row execute function public.commerce_set_updated_at();
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.commerce_set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.commerce_set_updated_at();
create trigger payments_set_updated_at before update on public.payments
for each row execute function public.commerce_set_updated_at();
create trigger refunds_set_updated_at before update on public.refunds
for each row execute function public.commerce_set_updated_at();

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_media enable row level security;
alter table public.product_prices enable row level security;
alter table public.inventory_items enable row level security;
alter table public.raffles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.commerce_events enable row level security;

revoke all on table public.products, public.product_variants, public.product_media, public.product_prices,
  public.inventory_items, public.raffles, public.customers, public.orders, public.order_items,
  public.payments, public.refunds, public.commerce_events from anon, authenticated;

grant select on table public.products, public.product_variants, public.product_media, public.product_prices, public.raffles to anon, authenticated;
grant all on table public.products, public.product_variants, public.product_media, public.product_prices,
  public.inventory_items, public.raffles, public.customers, public.orders, public.order_items,
  public.payments, public.refunds, public.commerce_events to service_role;

create policy "published products are public"
on public.products for select
to anon, authenticated
using (status = 'published' and published_at is not null and published_at <= now());

create policy "active variants of published products are public"
on public.product_variants for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1 from public.products p
    where p.id = product_variants.product_id
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

create policy "media for published products is public"
on public.product_media for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_media.product_id
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

create policy "active prices for published products are public"
on public.product_prices for select
to anon, authenticated
using (
  is_active
  and (active_from is null or active_from <= now())
  and (active_to is null or active_to > now())
  and exists (
    select 1 from public.products p
    where p.id = product_prices.product_id
      and p.status = 'published'
      and p.published_at is not null
      and p.published_at <= now()
  )
);

create policy "raffle presentation metadata is public"
on public.raffles for select
to anon, authenticated
using (status in ('upcoming', 'open', 'closed', 'drawing', 'completed', 'unavailable'));

create or replace view public.order_payment_summary
with (security_invoker = true)
as
select
  o.id as order_id,
  o.order_number,
  o.currency,
  o.grand_total_minor as amount_due_minor,
  coalesce(sum(p.amount_minor) filter (where p.status = 'succeeded'), 0)::bigint as paid_amount_minor,
  coalesce((
    select sum(r.amount_minor)
    from public.refunds r
    join public.payments rp on rp.id = r.payment_id
    where rp.order_id = o.id and r.status = 'succeeded'
  ), 0)::bigint as refunded_amount_minor,
  case
    when coalesce(sum(p.amount_minor) filter (where p.status = 'succeeded'), 0) = 0 then 'unpaid'
    when coalesce((
      select sum(r.amount_minor)
      from public.refunds r
      join public.payments rp on rp.id = r.payment_id
      where rp.order_id = o.id and r.status = 'succeeded'
    ), 0) >= coalesce(sum(p.amount_minor) filter (where p.status = 'succeeded'), 0) then 'refunded'
    when coalesce((
      select sum(r.amount_minor)
      from public.refunds r
      join public.payments rp on rp.id = r.payment_id
      where rp.order_id = o.id and r.status = 'succeeded'
    ), 0) > 0 then 'partially_refunded'
    when coalesce(sum(p.amount_minor) filter (where p.status = 'succeeded'), 0) < o.grand_total_minor then 'partially_paid'
    when coalesce(sum(p.amount_minor) filter (where p.status = 'succeeded'), 0) = o.grand_total_minor then 'paid'
    else 'overpaid'
  end as payment_status,
  (
    coalesce(sum(p.amount_minor) filter (where p.status = 'succeeded'), 0)
    - coalesce((
      select sum(r.amount_minor)
      from public.refunds r
      join public.payments rp on rp.id = r.payment_id
      where rp.order_id = o.id and r.status = 'succeeded'
    ), 0)
  )::bigint as net_received_minor
from public.orders o
left join public.payments p on p.order_id = o.id
group by o.id, o.order_number, o.currency, o.grand_total_minor;

revoke all on public.order_payment_summary from anon, authenticated;
grant select on public.order_payment_summary to service_role;
