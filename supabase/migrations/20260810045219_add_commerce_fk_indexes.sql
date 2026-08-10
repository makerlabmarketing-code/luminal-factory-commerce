create index order_items_product_idx on public.order_items(product_id);
create index order_items_variant_idx on public.order_items(variant_id);
create index product_media_variant_idx on public.product_media(variant_id);
create index product_prices_variant_idx on public.product_prices(variant_id);
