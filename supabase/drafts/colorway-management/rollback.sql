-- Disable app routes first. Preserve all variants and idempotency receipts.
begin;
drop function if exists public.manage_catalog_colorway(uuid,text,text,uuid,uuid,text,jsonb);
drop index if exists public.product_variants_colorway_slug_uidx;
-- Keep additive receipt operation values: existing receipts must remain readable.
-- Removing those values would invalidate history and is intentionally not done.
commit;
