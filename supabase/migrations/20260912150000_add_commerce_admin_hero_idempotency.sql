-- Prepared application contract for exactly-once Homepage Hero management operations.
-- Do not apply to Production without the separate reviewed database approval gate.

create table private.commerce_admin_idempotency_receipts (
  client_id text not null,
  operation_id uuid not null,
  operation text not null,
  request_fingerprint text not null,
  result_json jsonb,
  created_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null default statement_timestamp() + interval '14 days',
  primary key (client_id, operation_id),
  constraint commerce_admin_idempotency_client_id_check check (char_length(client_id) between 1 and 128 and client_id ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_idempotency_operation_check check (operation in ('create_draft', 'update_draft', 'publish', 'unpublish')),
  constraint commerce_admin_idempotency_fingerprint_check check (request_fingerprint ~ '^[0-9a-f]{64}$'),
  constraint commerce_admin_idempotency_expiry_check check (expires_at > created_at)
);

create index commerce_admin_idempotency_expiry_idx on private.commerce_admin_idempotency_receipts(expires_at);
alter table private.commerce_admin_idempotency_receipts enable row level security;
revoke all on table private.commerce_admin_idempotency_receipts from public, anon, authenticated;
grant select, insert, update, delete on table private.commerce_admin_idempotency_receipts to service_role;

create function public.manage_homepage_hero(
  p_operation_id uuid,
  p_client_id text,
  p_action text,
  p_target_id uuid,
  p_request_fingerprint text,
  p_hero jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_claimed boolean := false;
  v_existing private.commerce_admin_idempotency_receipts%rowtype;
  v_hero public.homepage_hero_presentations%rowtype;
begin
  if p_action not in ('create_draft', 'update_draft', 'publish', 'unpublish') then
    raise exception 'invalid Homepage Hero management action' using errcode = '22023';
  end if;

  insert into private.commerce_admin_idempotency_receipts (
    client_id, operation_id, operation, request_fingerprint
  ) values (
    p_client_id, p_operation_id, p_action, p_request_fingerprint
  )
  on conflict (client_id, operation_id) do nothing
  returning true into v_claimed;

  if not coalesce(v_claimed, false) then
    select * into v_existing
    from private.commerce_admin_idempotency_receipts
    where client_id = p_client_id and operation_id = p_operation_id;

    if not found or v_existing.operation <> p_action or v_existing.request_fingerprint <> p_request_fingerprint then
      raise exception 'operation id was already used for a different request' using errcode = '22023';
    end if;
    if v_existing.result_json is null then
      raise exception 'operation is already in progress' using errcode = '55P03';
    end if;
    return v_existing.result_json;
  end if;

  if p_action in ('create_draft', 'update_draft') and p_hero is null then
    raise exception 'Homepage Hero payload is required' using errcode = '22023';
  end if;

  if p_action = 'create_draft' then
    insert into public.homepage_hero_presentations (
      name, model_storage_path, poster_storage_path, tint, exposure,
      shadow_intensity, shadow_softness, auto_rotate, auto_rotate_delay_ms,
      rotation_per_second_deg, camera_theta_deg, camera_phi_deg,
      camera_radius_percent, camera_intro_radius_percent, camera_min_radius_percent,
      camera_max_radius_percent, camera_field_of_view_deg,
      camera_min_field_of_view_deg, camera_max_field_of_view_deg
    ) values (
      p_hero->>'name', p_hero->>'model_storage_path', p_hero->>'poster_storage_path', p_hero->>'tint',
      (p_hero->>'exposure')::double precision, (p_hero->>'shadow_intensity')::double precision,
      (p_hero->>'shadow_softness')::double precision, (p_hero->>'auto_rotate')::boolean,
      (p_hero->>'auto_rotate_delay_ms')::integer, (p_hero->>'rotation_per_second_deg')::double precision,
      (p_hero->>'camera_theta_deg')::double precision, (p_hero->>'camera_phi_deg')::double precision,
      (p_hero->>'camera_radius_percent')::double precision, (p_hero->>'camera_intro_radius_percent')::double precision,
      (p_hero->>'camera_min_radius_percent')::double precision, (p_hero->>'camera_max_radius_percent')::double precision,
      (p_hero->>'camera_field_of_view_deg')::double precision, (p_hero->>'camera_min_field_of_view_deg')::double precision,
      (p_hero->>'camera_max_field_of_view_deg')::double precision
    ) returning * into v_hero;
  elsif p_action = 'update_draft' then
    update public.homepage_hero_presentations set
      name = p_hero->>'name',
      model_storage_path = p_hero->>'model_storage_path',
      poster_storage_path = p_hero->>'poster_storage_path',
      tint = p_hero->>'tint',
      exposure = (p_hero->>'exposure')::double precision,
      shadow_intensity = (p_hero->>'shadow_intensity')::double precision,
      shadow_softness = (p_hero->>'shadow_softness')::double precision,
      auto_rotate = (p_hero->>'auto_rotate')::boolean,
      auto_rotate_delay_ms = (p_hero->>'auto_rotate_delay_ms')::integer,
      rotation_per_second_deg = (p_hero->>'rotation_per_second_deg')::double precision,
      camera_theta_deg = (p_hero->>'camera_theta_deg')::double precision,
      camera_phi_deg = (p_hero->>'camera_phi_deg')::double precision,
      camera_radius_percent = (p_hero->>'camera_radius_percent')::double precision,
      camera_intro_radius_percent = (p_hero->>'camera_intro_radius_percent')::double precision,
      camera_min_radius_percent = (p_hero->>'camera_min_radius_percent')::double precision,
      camera_max_radius_percent = (p_hero->>'camera_max_radius_percent')::double precision,
      camera_field_of_view_deg = (p_hero->>'camera_field_of_view_deg')::double precision,
      camera_min_field_of_view_deg = (p_hero->>'camera_min_field_of_view_deg')::double precision,
      camera_max_field_of_view_deg = (p_hero->>'camera_max_field_of_view_deg')::double precision
    where id = p_target_id and not is_active
    returning * into v_hero;
    if not found then raise exception 'Homepage Hero draft not found' using errcode = 'P0002'; end if;
  elsif p_action = 'publish' then
    if not public.publish_homepage_hero(p_target_id) then raise exception 'Homepage Hero not found' using errcode = 'P0002'; end if;
    select * into strict v_hero from public.homepage_hero_presentations where id = p_target_id;
  else
    perform public.unpublish_homepage_hero(p_target_id);
    select * into strict v_hero from public.homepage_hero_presentations where id = p_target_id;
  end if;

  update private.commerce_admin_idempotency_receipts
  set result_json = to_jsonb(v_hero)
  where client_id = p_client_id and operation_id = p_operation_id;

  return to_jsonb(v_hero);
end;
$$;

revoke execute on function public.manage_homepage_hero(uuid, text, text, uuid, text, jsonb) from public, anon, authenticated;
grant execute on function public.manage_homepage_hero(uuid, text, text, uuid, text, jsonb) to service_role;

select cron.schedule(
  'commerce-admin-idempotency-cleanup',
  '23 4 * * *',
  $cleanup$
    delete from private.commerce_admin_idempotency_receipts
    where expires_at <= statement_timestamp();
  $cleanup$
);
