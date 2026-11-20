begin;
-- Retain saved rate configuration and quote snapshots for recovery and accounting.
revoke select (raffle_id, country_code, customer_minor)
  on public.raffle_shipping_rates from anon, authenticated;
revoke insert, update on public.raffle_shipping_rates from service_role;
revoke execute on function public.confirm_raffle_winner_with_shipping_quote(uuid,text,uuid,uuid,text,text,jsonb)
  from service_role;
commit;
