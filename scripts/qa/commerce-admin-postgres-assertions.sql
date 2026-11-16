-- Local GitHub Actions PostgreSQL only. All function definitions are loaded from
-- the exact Commerce Supabase migrations. No external database or credentials.
do $$
begin
  if not exists (select 1 from pg_proc where oid=to_regprocedure('public.consume_commerce_admin_nonce(text,text,uuid)'))
    or not exists (select 1 from pg_proc where oid=to_regprocedure('public.manage_homepage_hero(uuid,text,text,uuid,text,jsonb)'))
    then raise exception 'Commerce RPC migration missing';
  end if;
  if not has_function_privilege('service_role', 'public.consume_commerce_admin_nonce(text,text,uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.consume_commerce_admin_nonce(text,text,uuid)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.consume_commerce_admin_nonce(text,text,uuid)', 'EXECUTE')
    or not has_function_privilege('service_role','public.manage_homepage_hero(uuid,text,text,uuid,text,jsonb)','EXECUTE')
    or has_function_privilege('anon','public.manage_homepage_hero(uuid,text,text,uuid,text,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','public.manage_homepage_hero(uuid,text,text,uuid,text,jsonb)','EXECUTE')
  then raise exception 'Function EXECUTE grants are not least-privilege';
  end if;
  if not (select rolbypassrls from pg_roles where rolname='service_role')
    or not (select relrowsecurity from pg_class where oid='private.commerce_admin_replay_nonces'::regclass)
    or not (select relrowsecurity from pg_class where oid='private.commerce_admin_idempotency_receipts'::regclass)
    or not (select relrowsecurity from pg_class where oid='public.homepage_hero_presentations'::regclass)
  then raise exception 'RLS role or table configuration differs from expected';
  end if;
end $$;

create or replace function public.ci_test_hero_input()
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'name','CI isolated draft',
    'model_storage_path','ci/isolated-draft.glb',
    'poster_storage_path',null,
    'tint','#112233',
    'exposure',1.08,
    'shadow_intensity',1.0,
    'shadow_softness',0.72,
    'auto_rotate',true,
    'auto_rotate_delay_ms',3200,
    'rotation_per_second_deg',5,
    'camera_theta_deg',0,
    'camera_phi_deg',76,
    'camera_radius_percent',104,
    'camera_intro_radius_percent',122,
    'camera_min_radius_percent',78,
    'camera_max_radius_percent',155,
    'camera_field_of_view_deg',29,
    'camera_min_field_of_view_deg',22,
    'camera_max_field_of_view_deg',42
  );
$$;

set role service_role;
do $$
declare
  v_first jsonb;
  v_again jsonb;
  v_op uuid := '44444444-4444-4444-8444-444444444444';
  v_request uuid := '55555555-5555-4555-8555-555555555555';
  v_conflict_blocked boolean := false;
  v_invalid_nonce_blocked boolean := false;
begin
  if not public.consume_commerce_admin_nonce('ci-current-key','ci_nonce_first_123456789012345',v_request) then
    raise exception 'First nonce should be accepted';
  end if;
  if public.consume_commerce_admin_nonce('ci-current-key','ci_nonce_first_123456789012345',v_request) then
    raise exception 'Same key/nonce replay must be rejected';
  end if;
  if not public.consume_commerce_admin_nonce('ci-previous-key','ci_nonce_first_123456789012345',v_request) then
    raise exception 'Nonce must be uniquely scoped by key id';
  end if;
  begin
    perform public.consume_commerce_admin_nonce('ci-current-key','short',v_request);
  exception when SQLSTATE '22023' then
    v_invalid_nonce_blocked := true;
  end;
  if not v_invalid_nonce_blocked then
    raise exception 'Invalid nonce was not rejected';
  end if;

  v_first := public.manage_homepage_hero(v_op,'ci-client','create_draft',null,repeat('a',64),public.ci_test_hero_input());
  v_again := public.manage_homepage_hero(v_op,'ci-client','create_draft',null,repeat('a',64),public.ci_test_hero_input());
  if v_first->>'id' is null or v_first->>'id' <> v_again->>'id' then
    raise exception 'Idempotent retry returned different row';
  end if;
  if (select count(*) from private.commerce_admin_idempotency_receipts where client_id='ci-client') <> 1
    or (select count(*) from public.homepage_hero_presentations) <> 1 then
    raise exception 'Idempotent retry duplicated a database row';
  end if;
  begin
    perform public.manage_homepage_hero(v_op,'ci-client','create_draft',null,repeat('f',64),public.ci_test_hero_input());
  exception when SQLSTATE '22023' then
    v_conflict_blocked := true;
  end;
  if not v_conflict_blocked then
    raise exception 'Reused operation id with changed fingerprint was not rejected';
  end if;
end $$;
reset role;
