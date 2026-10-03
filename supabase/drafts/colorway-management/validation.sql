-- Run only against a nonproduction database after forward.sql; rolls fixture back.
begin;
do $$
declare
  p uuid:=gen_random_uuid(); q uuid:=gen_random_uuid(); op uuid:=gen_random_uuid();
  r jsonb; replay jsonb; v uuid; rejected boolean;
begin
  insert into public.products(id,slug,name,product_type,release_type,status)
    values(p,'cw-fixture-'||p,'Colorway fixture','artisan_keycap','informational','draft'),
          (q,'cw-fixture-'||q,'Other fixture','artisan_keycap','informational','draft');
  r:=public.manage_catalog_colorway(op,'fixture','create_draft',p,p,repeat('1',64),
    '{"name":"Lolipop","slug":"lolipop","description":"Fixture"}'::jsonb);
  v:=(r->>'id')::uuid;
  if (r->>'is_active')::boolean or (r->>'product_id')::uuid<>p then raise exception 'draft invariant failed'; end if;
  replay:=public.manage_catalog_colorway(op,'fixture','create_draft',p,p,repeat('1',64),
    '{"name":"Lolipop","slug":"lolipop","description":"Fixture"}'::jsonb);
  if replay<>r then raise exception 'idempotency failed'; end if;
  rejected:=false;
  begin perform public.manage_catalog_colorway(op,'fixture','create_draft',p,p,repeat('2',64),
    '{"name":"Mono","slug":"mono"}'::jsonb); exception when sqlstate '22023' then rejected:=true; end;
  if not rejected then raise exception 'operation reuse allowed'; end if;
  rejected:=false;
  begin perform public.manage_catalog_colorway(gen_random_uuid(),'fixture','create_draft',p,p,repeat('3',64),
    '{"name":"Duplicate","slug":"lolipop"}'::jsonb); exception when unique_violation then rejected:=true; end;
  if not rejected then raise exception 'duplicate slug allowed'; end if;
  rejected:=false;
  begin perform public.manage_catalog_colorway(gen_random_uuid(),'fixture','update_draft',q,v,repeat('4',64),
    '{"name":"Wrong parent","slug":"mono"}'::jsonb); exception when sqlstate 'P0002' then rejected:=true; end;
  if not rejected then raise exception 'cross-product update allowed'; end if;
  update public.product_variants set attributes=attributes || '{"fixture_keep":"yes"}'::jsonb where id=v;
  perform public.manage_catalog_colorway(gen_random_uuid(),'fixture','update_draft',p,v,repeat('5',64),
    '{"name":"Lolipop updated","slug":"lolipop","description":"Updated"}'::jsonb);
  if (select attributes->>'fixture_keep' from public.product_variants where id=v)<>'yes' then
    raise exception 'existing metadata lost';
  end if;
  update public.product_variants set is_active=true where id=v;
  rejected:=false;
  begin perform public.manage_catalog_colorway(gen_random_uuid(),'fixture','update_draft',p,v,repeat('6',64),
    '{"name":"Changed active","slug":"lolipop"}'::jsonb); exception when sqlstate 'P0002' then rejected:=true; end;
  if not rejected then raise exception 'active variant mutated'; end if;
  update public.product_variants set is_active=false where id=v;
  update public.products set status='published',published_at=now() where id=p;
  rejected:=false;
  begin perform public.manage_catalog_colorway(gen_random_uuid(),'fixture','update_draft',p,v,repeat('7',64),
    '{"name":"Changed public","slug":"lolipop"}'::jsonb); exception when sqlstate '22023' then rejected:=true; end;
  if not rejected then raise exception 'published product mutated'; end if;
  if has_function_privilege('anon','public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb)','EXECUTE')
    or has_function_privilege('authenticated','public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb)','EXECUTE') then raise exception 'public execute granted'; end if;
end;
$$;
rollback;
