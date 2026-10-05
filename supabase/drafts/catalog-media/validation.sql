do $$
begin
  if not exists(select 1 from storage.buckets where id='catalog-media-drafts' and not public and file_size_limit=2097152 and allowed_mime_types=array['image/webp']) then raise exception 'Private bucket contract failed'; end if;
  if exists(select 1 from pg_class where oid in ('public.catalog_media_drafts'::regclass,'private.catalog_media_receipts'::regclass) and not relrowsecurity) then raise exception 'RLS disabled'; end if;
  if exists(select 1 from pg_proc where oid in ('public.read_catalog_media_draft(uuid,uuid)'::regprocedure,'public.save_catalog_media_draft(uuid,uuid,text,uuid,text,text,integer,jsonb)'::regprocedure) and prosecdef) then raise exception 'Unexpected definer'; end if;
  if has_table_privilege('anon','public.catalog_media_drafts','SELECT') or has_table_privilege('authenticated','public.catalog_media_drafts','SELECT') or
    has_function_privilege('anon','public.read_catalog_media_draft(uuid,uuid)','EXECUTE') or has_function_privilege('authenticated','public.save_catalog_media_draft(uuid,uuid,text,uuid,text,text,integer,jsonb)','EXECUTE') then raise exception 'Browser access allowed'; end if;
end $$;
