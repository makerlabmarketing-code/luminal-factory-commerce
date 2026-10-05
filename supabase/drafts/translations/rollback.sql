-- Disable feature while preserving content, receipts, FKs and indexes. No data loss.
begin;
revoke execute on function public.read_catalog_translation_draft(uuid,uuid,text),public.save_catalog_translation_draft(uuid,uuid,text,uuid,text,text,integer,jsonb,boolean) from service_role;
revoke select(product_id,variant_id,locale,content) on public.catalog_translation_public from anon,authenticated;
drop policy "approved translations for public catalog" on public.catalog_translation_public;
commit;
