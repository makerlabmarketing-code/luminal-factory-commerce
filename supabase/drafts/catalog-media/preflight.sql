select id,name,public,file_size_limit,allowed_mime_types from storage.buckets;
select to_regclass('public.catalog_media_drafts') draft_table,to_regclass('private.catalog_media_receipts') receipts;
select indexdef from pg_indexes where schemaname='public' and tablename='product_variants' and indexname='catalog_translation_variant_parent_idx';
select count(*) product_count from public.products;
select count(*) media_count from public.product_media;
-- Check broad Storage policies before enabling private signed uploads.
select policyname,roles,cmd,qual,with_check from pg_policies where schemaname='storage' and tablename='objects';
