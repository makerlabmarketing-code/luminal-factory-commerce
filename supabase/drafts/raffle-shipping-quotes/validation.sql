select
  has_column_privilege('anon', 'public.raffle_shipping_rates', 'customer_minor', 'SELECT') as public_customer_estimate,
  not has_column_privilege('anon', 'public.raffle_shipping_rates', 'carrier_minor', 'SELECT') as carrier_cost_private,
  not has_column_privilege('authenticated', 'public.raffle_shipping_rates', 'covered_minor', 'SELECT') as subsidy_private,
  not has_function_privilege('anon', 'public.confirm_raffle_winner_with_shipping_quote(uuid,text,uuid,uuid,text,text,jsonb)', 'EXECUTE') as winner_confirmation_private;
