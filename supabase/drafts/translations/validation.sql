do $$
declare v_role text; v_table text;
begin
  foreach v_table in array array['catalog_translation_drafts','catalog_translation_public'] loop
    if not (select relrowsecurity from pg_class where oid=('public.'||v_table)::regclass) then raise exception 'RLS missing'; end if;
  end loop;
  foreach v_role in array array['anon','authenticated'] loop
    if has_table_privilege(v_role,'public.catalog_translation_drafts','select,insert,update,delete')
      or has_table_privilege(v_role,'public.catalog_translation_public','insert,update,delete')
      or has_table_privilege(v_role,'private.catalog_translation_receipts','select,insert,update,delete')
      or has_function_privilege(v_role,'public.save_catalog_translation_draft(uuid,uuid,text,uuid,text,text,integer,jsonb,boolean)','execute') then
      raise exception 'browser privilege leak';
    end if;
  end loop;
  if exists(select 1 from pg_proc where oid in (
    'public.read_catalog_translation_draft(uuid,uuid,text)'::regprocedure,
    'public.save_catalog_translation_draft(uuid,uuid,text,uuid,text,text,integer,jsonb,boolean)'::regprocedure) and prosecdef) then raise exception 'unexpected definer'; end if;
end; $$;
