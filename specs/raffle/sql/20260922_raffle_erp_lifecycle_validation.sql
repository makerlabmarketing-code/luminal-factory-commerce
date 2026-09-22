-- Read-only validation for the raffle ERP lifecycle draft after an approved apply.

select
  to_regclass('public.raffles') as raffles,
  to_regclass('public.raffle_entries') as raffle_entries,
  to_regclass('private.raffle_entry_shipping_addresses') as raffle_shipping,
  to_regclass('public.raffle_winner_allocations') as winner_allocations,
  to_regclass('public.raffle_winner_allocation_events') as winner_events,
  to_regclass('private.order_shipping_addresses') as order_shipping;

select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'raffles'
  and column_name in ('is_test', 'variant_id', 'results_published_at')
order by column_name;

select schemaname, tablename, policyname, roles, cmd, qual
from pg_policies
where schemaname = 'public'
  and tablename in ('raffles', 'raffle_winner_allocations', 'raffle_winner_allocation_events')
order by tablename, policyname;

select grantee, table_schema, table_name, privilege_type
from information_schema.role_table_grants
where table_schema in ('public', 'private')
  and table_name in (
    'raffle_entry_shipping_addresses',
    'raffle_winner_allocations',
    'raffle_winner_allocation_events',
    'order_shipping_addresses'
  )
order by table_schema, table_name, grantee, privilege_type;

select
  has_function_privilege('anon', 'public.submit_guest_raffle_entry_v2(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE') as anon_v2_execute,
  has_function_privilege('authenticated', 'public.submit_guest_raffle_entry_v2(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE') as authenticated_v2_execute,
  has_function_privilege('service_role', 'public.submit_guest_raffle_entry_v2(uuid,text,text,text,text,text,text,text,text,text,text,text,text,text)', 'EXECUTE') as service_role_v2_execute;

select
  (select count(*) from public.raffle_winner_allocations) as winner_allocations,
  (select count(*) from public.raffle_winner_allocation_events) as winner_events,
  (select count(*) from private.raffle_entry_shipping_addresses) as entry_shipping,
  (select count(*) from private.order_shipping_addresses) as order_shipping;
