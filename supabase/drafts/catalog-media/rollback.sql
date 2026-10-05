-- Disable access only; preserve all drafts, receipts and image files for recovery.
begin;
revoke execute on function public.read_catalog_media_draft(uuid,uuid),public.save_catalog_media_draft(uuid,uuid,text,uuid,text,text,integer,jsonb) from service_role;
revoke all on public.catalog_media_drafts,private.catalog_media_receipts from service_role;
commit;
