-- Follow-up hardening for optional raffle shipping fields.
create or replace function public.submit_guest_raffle_entry_v2(
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
  v_address_line_2 text := nullif(btrim(p_address_line_2), '');
  v_postal_code text := nullif(btrim(p_postal_code), '');
  v_phone text := nullif(btrim(p_phone), '');
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
    or v_country_code !~ '^[A-Z]{2}$'
    or (v_address_line_2 is not null and length(v_address_line_2) not between 1 and 240)
    or (v_postal_code is not null and length(v_postal_code) not between 1 and 32)
    or (v_phone is not null and length(v_phone) not between 5 and 32)
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
      v_address_line_2,
      btrim(p_city),
      btrim(p_state_province),
      v_postal_code,
      v_country_code,
      v_phone
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
