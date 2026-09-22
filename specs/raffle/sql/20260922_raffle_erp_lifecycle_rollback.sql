-- DRAFT rollback for specs/raffle/sql/20260922_raffle_erp_lifecycle_forward.sql
-- Safe only before live raffle shipping/winner/order data exists.

do $$
begin
  if exists (select 1 from public.raffle_winner_allocations)
    or exists (select 1 from public.raffle_winner_allocation_events)
    or exists (select 1 from private.raffle_entry_shipping_addresses)
    or exists (select 1 from private.order_shipping_addresses)
  then
    raise exception 'raffle ERP lifecycle rollback refused: live rows exist';
  end if;
end $$;

drop function if exists public.submit_guest_raffle_entry_v2(
  uuid, text, text, text, text, text, text, text, text, text, text, text, text, text
);

drop table if exists public.raffle_winner_allocation_events;
drop table if exists public.raffle_winner_allocations;
drop table if exists private.order_shipping_addresses;
drop table if exists private.raffle_entry_shipping_addresses;

drop index if exists public.raffles_variant_id_idx;

drop policy if exists "Public can read published raffles" on public.raffles;
create policy "Public can read published raffles"
on public.raffles
for select
to anon, authenticated
using (
  is_published
  and published_at is not null
  and published_at <= statement_timestamp()
);

alter table public.raffles
  drop column if exists results_published_at,
  drop column if exists variant_id,
  drop column if exists is_test;
