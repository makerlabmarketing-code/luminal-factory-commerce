-- RAFFLE-ERP-SCHEMA-01 continuation.
-- Reconciled repository source for Production migration 20260922074248.
alter table private.commerce_admin_idempotency_receipts
  drop constraint if exists commerce_admin_idempotency_operation_check;

alter table private.commerce_admin_idempotency_receipts
  add constraint commerce_admin_idempotency_operation_check
  check ((operation = ANY (ARRAY['create_draft'::text, 'update_draft'::text, 'publish'::text, 'unpublish'::text, 'product_create_draft'::text, 'product_update_draft'::text, 'product_publish'::text, 'product_archive'::text, 'raffle_create_draft'::text, 'raffle_update_draft'::text, 'raffle_publish'::text, 'raffle_unpublish'::text, 'raffle_winner_select'::text, 'raffle_winner_confirm'::text, 'raffle_winner_confirm_payment'::text, 'raffle_winner_start_fulfillment'::text, 'raffle_winner_complete'::text, 'raffle_winner_cancel'::text, 'raffle_winner_reallocate'::text, 'raffle_result_publish'::text])));

CREATE OR REPLACE FUNCTION public.read_raffle_entries_for_admin(p_raffle_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO ''
 SET statement_timeout TO '5s'
AS $function$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'raffle_id', e.raffle_id,
        'contact_email', e.contact_email,
        'display_name', e.display_name,
        'rules_version', e.rules_version,
        'accepted_at', e.accepted_at,
        'created_at', e.created_at,
        'shipping', case
          when s.raffle_entry_id is null then null
          else jsonb_build_object(
            'recipient_name', s.recipient_name,
            'address_line_1', s.address_line_1,
            'address_line_2', s.address_line_2,
            'city', s.city,
            'state_province', s.state_province,
            'postal_code', s.postal_code,
            'country_code', s.country_code,
            'phone', s.phone
          )
        end
      )
      order by e.created_at asc
    ),
    '[]'::jsonb
  )
  from public.raffle_entries e
  left join private.raffle_entry_shipping_addresses s
    on s.raffle_entry_id = e.id
  where e.raffle_id = p_raffle_id;
$function$

revoke execute on function public.read_raffle_entries_for_admin(uuid)
  from public, anon, authenticated;
grant execute on function public.read_raffle_entries_for_admin(uuid)
  to service_role;

CREATE OR REPLACE FUNCTION public.manage_raffle_winner_allocation(p_operation_id uuid, p_client_id text, p_action text, p_raffle_id uuid, p_allocation_id uuid, p_entry_id uuid, p_actor_id text, p_request_fingerprint text, p_payload jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
 SET statement_timeout TO '8s'
 SET lock_timeout TO '2s'
AS $function$
declare
  v_operation text := 'raffle_winner_' || p_action;
  v_claimed boolean := false;
  v_existing private.commerce_admin_idempotency_receipts%rowtype;
  v_allocation public.raffle_winner_allocations%rowtype;
  v_new_allocation public.raffle_winner_allocations%rowtype;
  v_raffle public.raffles%rowtype;
  v_entry public.raffle_entries%rowtype;
  v_shipping private.raffle_entry_shipping_addresses%rowtype;
  v_product public.products%rowtype;
  v_variant public.product_variants%rowtype;
  v_price public.product_prices%rowtype;
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_sequence integer;
  v_shipping_minor bigint;
  v_amount_due bigint;
  v_payment_deadline timestamptz;
  v_fulfillment_due timestamptz;
  v_reason text;
  v_order_number text;
  v_result jsonb;
  v_from_status text;
begin
  if p_action not in (
    'select',
    'confirm',
    'confirm_payment',
    'start_fulfillment',
    'complete',
    'cancel',
    'reallocate'
  ) then
    raise exception 'invalid raffle winner action' using errcode = '22023';
  end if;

  if p_actor_id is null or length(btrim(p_actor_id)) not between 1 and 160 then
    raise exception 'raffle winner actor is required' using errcode = '22023';
  end if;

  insert into private.commerce_admin_idempotency_receipts (
    client_id, operation_id, operation, request_fingerprint
  ) values (
    p_client_id, p_operation_id, v_operation, p_request_fingerprint
  )
  on conflict (client_id, operation_id) do nothing
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    select * into v_existing
    from private.commerce_admin_idempotency_receipts
    where client_id = p_client_id and operation_id = p_operation_id;

    if not found
      or v_existing.operation <> v_operation
      or v_existing.request_fingerprint <> p_request_fingerprint
    then
      raise exception 'operation id was already used for a different request' using errcode = '22023';
    end if;

    if v_existing.result_json is null then
      raise exception 'operation is already in progress' using errcode = '55P03';
    end if;

    return v_existing.result_json;
  end if;

  select * into v_raffle
  from public.raffles
  where id = p_raffle_id
  for update;

  if not found then
    raise exception 'raffle not found' using errcode = 'P0002';
  end if;

  if p_action = 'select' then
    if p_entry_id is null then
      raise exception 'raffle entry is required' using errcode = '22023';
    end if;

    select * into v_entry
    from public.raffle_entries
    where id = p_entry_id and raffle_id = p_raffle_id;

    if not found then
      raise exception 'raffle entry not found' using errcode = 'P0002';
    end if;

    select coalesce(max(allocation_sequence), 0) + 1
      into v_sequence
    from public.raffle_winner_allocations
    where raffle_id = p_raffle_id;

    insert into public.raffle_winner_allocations (
      raffle_id, raffle_entry_id, allocation_sequence, status
    ) values (
      p_raffle_id, p_entry_id, v_sequence, 'SELECTED'
    )
    returning * into v_allocation;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values (
      v_allocation.id, p_raffle_id, 'selected', null, 'SELECTED',
      btrim(p_actor_id), p_operation_id, null
    );

    v_result := jsonb_build_object('allocation', to_jsonb(v_allocation));

  elsif p_action = 'confirm' then
    if p_allocation_id is null then
      raise exception 'winner allocation is required' using errcode = '22023';
    end if;

    select * into v_allocation
    from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id
    for update;

    if not found then
      raise exception 'winner allocation not found' using errcode = 'P0002';
    end if;

    if v_allocation.status <> 'SELECTED' then
      raise exception 'winner allocation is not selectable for payment' using errcode = '22023';
    end if;

    v_shipping_minor := coalesce((p_payload->>'shipping_minor')::bigint, -1);
    v_payment_deadline := nullif(p_payload->>'payment_deadline_at', '')::timestamptz;
    v_fulfillment_due := nullif(p_payload->>'fulfillment_due_at', '')::timestamptz;

    if v_shipping_minor < 0
      or v_payment_deadline is null
      or v_payment_deadline <= statement_timestamp()
    then
      raise exception 'invalid winner payment terms' using errcode = '22023';
    end if;

    select * into v_entry
    from public.raffle_entries
    where id = v_allocation.raffle_entry_id and raffle_id = p_raffle_id;

    if not found then
      raise exception 'raffle entry not found' using errcode = 'P0002';
    end if;

    select * into v_shipping
    from private.raffle_entry_shipping_addresses
    where raffle_entry_id = v_entry.id;

    if not found then
      raise exception 'raffle shipping address is missing' using errcode = '22023';
    end if;

    if v_raffle.product_id is null then
      raise exception 'raffle product is missing' using errcode = '22023';
    end if;

    select * into v_product
    from public.products
    where id = v_raffle.product_id;

    if not found then
      raise exception 'raffle product not found' using errcode = 'P0002';
    end if;

    if v_raffle.variant_id is not null then
      select * into v_variant
      from public.product_variants
      where id = v_raffle.variant_id
        and product_id = v_raffle.product_id
        and is_active;

      if not found then
        raise exception 'raffle variant is invalid' using errcode = '22023';
      end if;
    end if;

    select * into v_price
    from public.product_prices
    where product_id = v_raffle.product_id
      and is_active
      and (active_from is null or active_from <= statement_timestamp())
      and (active_to is null or active_to > statement_timestamp())
      and (
        (v_raffle.variant_id is null and variant_id is null)
        or variant_id = v_raffle.variant_id
      )
    order by active_from desc nulls last, created_at desc
    limit 1;

    if not found then
      raise exception 'raffle active price is missing' using errcode = '22023';
    end if;

    v_amount_due := v_price.amount_minor + v_shipping_minor;
    v_order_number := 'LF-RF-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

    insert into public.orders (
      order_number,
      customer_email_snapshot,
      customer_name_snapshot,
      currency,
      status,
      subtotal_minor,
      shipping_minor,
      grand_total_minor,
      placed_at,
      notes
    ) values (
      v_order_number,
      v_entry.contact_email,
      v_entry.display_name,
      v_price.currency,
      'pending',
      v_price.amount_minor,
      v_shipping_minor,
      v_amount_due,
      statement_timestamp(),
      'Raffle winner allocation ' || v_allocation.id::text
    )
    returning * into v_order;

    insert into public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      sku_snapshot,
      quantity,
      unit_price_minor,
      line_total_minor
    ) values (
      v_order.id,
      v_product.id,
      v_raffle.variant_id,
      v_product.name,
      case when v_raffle.variant_id is null then null else v_variant.name end,
      case when v_raffle.variant_id is null then null else v_variant.sku end,
      1,
      v_price.amount_minor,
      v_price.amount_minor
    );

    insert into private.order_shipping_addresses (
      order_id,
      recipient_name,
      address_line_1,
      address_line_2,
      city,
      state_province,
      postal_code,
      country_code,
      phone
    ) values (
      v_order.id,
      v_shipping.recipient_name,
      v_shipping.address_line_1,
      v_shipping.address_line_2,
      v_shipping.city,
      v_shipping.state_province,
      v_shipping.postal_code,
      v_shipping.country_code,
      v_shipping.phone
    );

    insert into public.payments (
      order_id,
      provider,
      provider_payment_id,
      idempotency_key,
      status,
      currency,
      amount_minor
    ) values (
      v_order.id,
      'manual_bank_transfer',
      null,
      'raffle:' || v_allocation.id::text || ':payment',
      'pending',
      v_price.currency,
      v_amount_due
    )
    returning * into v_payment;

    update public.raffle_winner_allocations
    set status = 'PAYMENT_PENDING',
        confirmed_at = statement_timestamp(),
        payment_deadline_at = v_payment_deadline,
        fulfillment_due_at = v_fulfillment_due,
        order_id = v_order.id
    where id = v_allocation.id
    returning * into v_allocation;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values (
      v_allocation.id, p_raffle_id, 'payment_requested', 'SELECTED', 'PAYMENT_PENDING',
      btrim(p_actor_id), p_operation_id, null
    );

    v_result := jsonb_build_object(
      'allocation', to_jsonb(v_allocation),
      'order', to_jsonb(v_order),
      'payment', to_jsonb(v_payment)
    );

  elsif p_action = 'confirm_payment' then
    select * into v_allocation
    from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id
    for update;

    if not found then
      raise exception 'winner allocation not found' using errcode = 'P0002';
    end if;

    if v_allocation.status <> 'PAYMENT_PENDING' or v_allocation.order_id is null then
      raise exception 'winner allocation is not awaiting payment' using errcode = '22023';
    end if;

    select * into v_payment
    from public.payments
    where order_id = v_allocation.order_id and status = 'pending'
    order by created_at desc
    limit 1
    for update;

    if not found then
      raise exception 'pending raffle payment not found' using errcode = 'P0002';
    end if;

    update public.payments
    set status = 'succeeded',
        provider_payment_id = coalesce(
          nullif(btrim(p_payload->>'payment_reference'), ''),
          provider_payment_id
        ),
        succeeded_at = statement_timestamp()
    where id = v_payment.id
    returning * into v_payment;

    update public.orders
    set status = 'confirmed'
    where id = v_allocation.order_id
    returning * into v_order;

    update public.raffle_winner_allocations
    set status = 'PAID',
        paid_at = statement_timestamp()
    where id = v_allocation.id
    returning * into v_allocation;

    insert into public.commerce_events (
      event_type, aggregate_type, aggregate_id, idempotency_key, payload
    ) values (
      'order_paid',
      'order',
      v_order.id,
      'raffle-order-paid:' || v_allocation.id::text,
      jsonb_build_object(
        'raffle_id', p_raffle_id,
        'allocation_id', v_allocation.id,
        'payment_id', v_payment.id
      )
    )
    on conflict (idempotency_key) do nothing;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values (
      v_allocation.id, p_raffle_id, 'payment_confirmed', 'PAYMENT_PENDING', 'PAID',
      btrim(p_actor_id), p_operation_id, nullif(btrim(p_payload->>'note'), '')
    );

    v_result := jsonb_build_object(
      'allocation', to_jsonb(v_allocation),
      'order', to_jsonb(v_order),
      'payment', to_jsonb(v_payment)
    );

  elsif p_action = 'start_fulfillment' then
    select * into v_allocation
    from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id
    for update;

    if not found then raise exception 'winner allocation not found' using errcode = 'P0002'; end if;
    if v_allocation.status <> 'PAID' then
      raise exception 'winner allocation is not paid' using errcode = '22023';
    end if;

    v_fulfillment_due := nullif(p_payload->>'fulfillment_due_at', '')::timestamptz;

    update public.raffle_winner_allocations
    set status = 'FULFILLING',
        fulfillment_due_at = coalesce(v_fulfillment_due, fulfillment_due_at)
    where id = v_allocation.id
    returning * into v_allocation;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values (
      v_allocation.id, p_raffle_id, 'fulfillment_started', 'PAID', 'FULFILLING',
      btrim(p_actor_id), p_operation_id, nullif(btrim(p_payload->>'note'), '')
    );

    v_result := jsonb_build_object('allocation', to_jsonb(v_allocation));

  elsif p_action = 'complete' then
    select * into v_allocation
    from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id
    for update;

    if not found then raise exception 'winner allocation not found' using errcode = 'P0002'; end if;
    if v_allocation.status not in ('PAID', 'FULFILLING') or v_allocation.order_id is null then
      raise exception 'winner allocation is not fulfillable' using errcode = '22023';
    end if;

    v_from_status := v_allocation.status;

    update public.orders
    set status = 'fulfilled',
        fulfilled_at = statement_timestamp()
    where id = v_allocation.order_id
    returning * into v_order;

    update public.raffle_winner_allocations
    set status = 'COMPLETED',
        completed_at = statement_timestamp()
    where id = v_allocation.id
    returning * into v_allocation;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values (
      v_allocation.id, p_raffle_id, 'completed',
      v_from_status,
      'COMPLETED', btrim(p_actor_id), p_operation_id, nullif(btrim(p_payload->>'note'), '')
    );

    v_result := jsonb_build_object('allocation', to_jsonb(v_allocation), 'order', to_jsonb(v_order));

  elsif p_action = 'cancel' then
    select * into v_allocation
    from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id
    for update;

    if not found then raise exception 'winner allocation not found' using errcode = 'P0002'; end if;
    if v_allocation.status not in ('SELECTED', 'CONFIRMED', 'PAYMENT_PENDING') then
      raise exception 'paid or completed allocation cannot be cancelled here' using errcode = '22023';
    end if;

    v_from_status := v_allocation.status;
    v_reason := nullif(btrim(p_payload->>'reason'), '');
    if v_reason is null or length(v_reason) < 3 then
      raise exception 'cancellation reason is required' using errcode = '22023';
    end if;

    if v_allocation.order_id is not null then
      update public.payments
      set status = 'cancelled'
      where order_id = v_allocation.order_id and status = 'pending';

      update public.orders
      set status = 'cancelled',
          cancelled_at = statement_timestamp()
      where id = v_allocation.order_id
      returning * into v_order;
    end if;

    update public.raffle_winner_allocations
    set status = 'CANCELLED',
        cancelled_at = statement_timestamp(),
        cancellation_reason = v_reason
    where id = v_allocation.id
    returning * into v_allocation;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values (
      v_allocation.id, p_raffle_id, 'cancelled', v_from_status, 'CANCELLED',
      btrim(p_actor_id), p_operation_id, v_reason
    );

    v_result := jsonb_build_object('allocation', to_jsonb(v_allocation), 'order', to_jsonb(v_order));

  else
    if p_allocation_id is null or p_entry_id is null then
      raise exception 'prior allocation and replacement entry are required' using errcode = '22023';
    end if;

    select * into v_allocation
    from public.raffle_winner_allocations
    where id = p_allocation_id and raffle_id = p_raffle_id
    for update;

    if not found then raise exception 'winner allocation not found' using errcode = 'P0002'; end if;
    if v_allocation.status <> 'CANCELLED' then
      raise exception 'only a cancelled allocation can be reallocated' using errcode = '22023';
    end if;

    select * into v_entry
    from public.raffle_entries
    where id = p_entry_id and raffle_id = p_raffle_id;

    if not found then raise exception 'replacement raffle entry not found' using errcode = 'P0002'; end if;

    select coalesce(max(allocation_sequence), 0) + 1
      into v_sequence
    from public.raffle_winner_allocations
    where raffle_id = p_raffle_id;

    update public.raffle_winner_allocations
    set status = 'REALLOCATED'
    where id = v_allocation.id
    returning * into v_allocation;

    insert into public.raffle_winner_allocations (
      raffle_id, raffle_entry_id, allocation_sequence, status
    ) values (
      p_raffle_id, p_entry_id, v_sequence, 'SELECTED'
    )
    returning * into v_new_allocation;

    insert into public.raffle_winner_allocation_events (
      allocation_id, raffle_id, event_type, from_status, to_status,
      actor_id, request_id, note
    ) values
      (
        v_allocation.id, p_raffle_id, 'reallocated', 'CANCELLED', 'REALLOCATED',
        btrim(p_actor_id), p_operation_id, null
      ),
      (
        v_new_allocation.id, p_raffle_id, 'selected_after_reallocation', null, 'SELECTED',
        btrim(p_actor_id), p_operation_id, null
      );

    v_result := jsonb_build_object(
      'priorAllocation', to_jsonb(v_allocation),
      'allocation', to_jsonb(v_new_allocation)
    );
  end if;

  update private.commerce_admin_idempotency_receipts
  set result_json = v_result
  where client_id = p_client_id and operation_id = p_operation_id;

  return v_result;
end;
$function$

revoke execute on function public.manage_raffle_winner_allocation(
  uuid, text, text, uuid, uuid, uuid, text, text, jsonb
) from public, anon, authenticated;
grant execute on function public.manage_raffle_winner_allocation(
  uuid, text, text, uuid, uuid, uuid, text, text, jsonb
) to service_role;

CREATE OR REPLACE FUNCTION public.publish_raffle_result(p_operation_id uuid, p_client_id text, p_raffle_id uuid, p_actor_id text, p_request_fingerprint text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
 SET statement_timeout TO '5s'
 SET lock_timeout TO '2s'
AS $function$
declare
  v_claimed boolean := false;
  v_existing private.commerce_admin_idempotency_receipts%rowtype;
  v_raffle public.raffles%rowtype;
  v_allocation public.raffle_winner_allocations%rowtype;
  v_entry public.raffle_entries%rowtype;
  v_result jsonb;
begin
  insert into private.commerce_admin_idempotency_receipts (
    client_id, operation_id, operation, request_fingerprint
  ) values (
    p_client_id, p_operation_id, 'raffle_result_publish', p_request_fingerprint
  )
  on conflict (client_id, operation_id) do nothing
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    select * into v_existing
    from private.commerce_admin_idempotency_receipts
    where client_id = p_client_id and operation_id = p_operation_id;

    if not found
      or v_existing.operation <> 'raffle_result_publish'
      or v_existing.request_fingerprint <> p_request_fingerprint
    then
      raise exception 'operation id was already used for a different request' using errcode = '22023';
    end if;

    if v_existing.result_json is null then
      raise exception 'operation is already in progress' using errcode = '55P03';
    end if;

    return v_existing.result_json;
  end if;

  select * into v_raffle
  from public.raffles
  where id = p_raffle_id
  for update;

  if not found then raise exception 'raffle not found' using errcode = 'P0002'; end if;

  select * into v_allocation
  from public.raffle_winner_allocations
  where raffle_id = p_raffle_id
    and status in ('PAYMENT_PENDING', 'PAID', 'FULFILLING', 'COMPLETED')
  order by allocation_sequence desc
  limit 1;

  if not found then
    raise exception 'raffle has no publishable winner allocation' using errcode = '22023';
  end if;

  select * into v_entry
  from public.raffle_entries
  where id = v_allocation.raffle_entry_id;

  update public.raffles
  set results_published_at = statement_timestamp()
  where id = p_raffle_id
  returning * into v_raffle;

  v_result := jsonb_build_object(
    'raffle_id', v_raffle.id,
    'results_published_at', v_raffle.results_published_at,
    'winner', jsonb_build_object(
      'public_code', v_allocation.public_code,
      'display_name', left(v_entry.display_name, 1) || repeat('*', greatest(length(v_entry.display_name) - 1, 2))
    )
  );

  update private.commerce_admin_idempotency_receipts
  set result_json = v_result
  where client_id = p_client_id and operation_id = p_operation_id;

  return v_result;
end;
$function$

revoke execute on function public.publish_raffle_result(uuid, text, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.publish_raffle_result(uuid, text, uuid, text, text)
  to service_role;
