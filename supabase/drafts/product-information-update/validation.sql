-- DISPOSABLE DATABASE ONLY. Transactional fixtures; never run unapproved in Production.
begin;
set local role service_role;
do $$
declare
  p uuid := gen_random_uuid();
  op uuid;
  result jsonb;
  replay jsonb;
  state text;
  payload jsonb;
  rejected boolean;
  published_time timestamptz := '2026-10-01T00:00:00Z';
begin
  insert into public.products(id,slug,name,description,product_type,release_type)
  values(p,'information-fixture-' || p,'Fixture','Original','artisan_keycap','informational');
  foreach state in array array['draft','published','archived'] loop
    update public.products set status=state, published_at=published_time where id=p;
    payload := jsonb_build_object('slug','information-fixture-' || p,'name','Changed ' || state,
      'description','Changed description','product_type','artisan_keycap','release_type','informational');
    op := gen_random_uuid();
    result := public.manage_catalog_product(op,'information-test','update_draft',p,repeat('a',64),payload);
    replay := public.manage_catalog_product(op,'information-test','update_draft',p,repeat('a',64),payload);
    if result is distinct from replay or result->>'status' <> state or result->>'name' <> 'Changed ' || state
      or (result->>'published_at')::timestamptz is distinct from published_time then
      raise exception 'information update changed state or retry result';
    end if;
    rejected := false;
    begin
      perform public.manage_catalog_product(op,'information-test','update_draft',p,repeat('b',64),payload);
    exception when sqlstate '22023' then rejected := true; end;
    if not rejected then raise exception 'operation replay mismatch accepted'; end if;
    if state <> 'draft' then
      rejected := false;
      begin
        perform public.manage_catalog_product(gen_random_uuid(),'information-test','update_draft',p,repeat('c',64),payload || '{"slug":"changed-protected-slug"}'::jsonb);
      exception when sqlstate 'P0002' then rejected := true; end;
      if not rejected then raise exception 'protected slug changed'; end if;
      rejected := false;
      begin
        perform public.manage_catalog_product(gen_random_uuid(),'information-test','update_draft',p,repeat('d',64),payload || '{"product_type":"other"}'::jsonb);
      exception when sqlstate 'P0002' then rejected := true; end;
      if not rejected then raise exception 'protected type changed'; end if;
      rejected := false;
      begin
        perform public.manage_catalog_product(gen_random_uuid(),'information-test','update_draft',p,repeat('e',64),payload || '{"release_type":"direct"}'::jsonb);
      exception when sqlstate '22023' or sqlstate 'P0002' then rejected := true; end;
      if not rejected then raise exception 'keycap sale rule bypassed'; end if;
    end if;
  end loop;
  update public.products set status='published',release_type='direct' where id=p;
  payload := jsonb_build_object('slug','information-fixture-' || p,'name','Legacy description update',
    'description','Information only','product_type','artisan_keycap','release_type','direct');
  result := public.manage_catalog_product(gen_random_uuid(),'information-test','update_draft',p,repeat('f',64),payload);
  if result->>'release_type' <> 'direct' or result->>'status' <> 'published' or result->>'name' <> 'Legacy description update' then
    raise exception 'legacy release information was not preserved';
  end if;
  update public.products set status='draft' where id=p;
  rejected := false;
  begin perform public.manage_catalog_product(gen_random_uuid(),'information-test','update_draft',p,repeat('0',64),payload);
  exception when sqlstate '22023' then rejected := true; end;
  if not rejected then raise exception 'legacy direct release accepted for draft editing'; end if;
  if has_function_privilege('anon','public.manage_catalog_product(uuid,text,text,uuid,text,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','public.manage_catalog_product(uuid,text,text,uuid,text,jsonb)','EXECUTE') then
    raise exception 'public execution allowed';
  end if;
end;
$$;
rollback;
