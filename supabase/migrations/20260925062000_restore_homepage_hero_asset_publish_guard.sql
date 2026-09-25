-- Restore and harden Homepage Hero asset validation before management UI activation.
-- Prepared for explicit Production migration approval. Runtime integration remains default-off.

create or replace function public.homepage_hero_asset_object_ready(
  asset_path text,
  asset_kind text
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from storage.objects as objects
    where objects.bucket_id = 'homepage-hero'
      and objects.name = asset_path
      and coalesce(objects.metadata->>'size', '') ~ '^[0-9]+$'
      and (objects.metadata->>'size')::bigint between 1 and 10485760
      and (
        (
          asset_kind = 'model'
          and lower(asset_path) ~ '\.glb$'
          and lower(coalesce(objects.metadata->>'mimetype', '')) in (
            'model/gltf-binary',
            'application/octet-stream'
          )
        )
        or
        (
          asset_kind = 'poster'
          and (
            (lower(asset_path) ~ '\.webp$' and lower(coalesce(objects.metadata->>'mimetype', '')) = 'image/webp')
            or (lower(asset_path) ~ '\.avif$' and lower(coalesce(objects.metadata->>'mimetype', '')) = 'image/avif')
            or (lower(asset_path) ~ '\.png$' and lower(coalesce(objects.metadata->>'mimetype', '')) = 'image/png')
          )
        )
      )
  );
$$;

revoke all on function public.homepage_hero_asset_object_ready(text, text)
  from public, anon, authenticated;
grant execute on function public.homepage_hero_asset_object_ready(text, text)
  to service_role;

create or replace function public.homepage_hero_assets_ready(
  model_path text,
  poster_path text default null
)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    public.homepage_hero_asset_object_ready(model_path, 'model')
    and (
      poster_path is null
      or public.homepage_hero_asset_object_ready(poster_path, 'poster')
    );
$$;

revoke all on function public.homepage_hero_assets_ready(text, text)
  from public, anon, authenticated;
grant execute on function public.homepage_hero_assets_ready(text, text)
  to service_role;

create or replace function public.homepage_hero_require_assets_before_publish()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.is_active
    and not public.homepage_hero_assets_ready(new.model_storage_path, new.poster_storage_path)
  then
    raise exception 'Homepage Hero assets must exist and satisfy approved Storage constraints before publishing.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.homepage_hero_require_assets_before_publish()
  from public, anon, authenticated;
grant execute on function public.homepage_hero_require_assets_before_publish()
  to service_role;

drop trigger if exists homepage_hero_require_assets_before_publish
  on public.homepage_hero_presentations;

create trigger homepage_hero_require_assets_before_publish
before insert or update of model_storage_path, poster_storage_path, is_active
on public.homepage_hero_presentations
for each row
execute function public.homepage_hero_require_assets_before_publish();

create or replace function public.publish_homepage_hero(target_id uuid)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  target_hero public.homepage_hero_presentations%rowtype;
begin
  lock table public.homepage_hero_presentations in share row exclusive mode;

  select *
  into target_hero
  from public.homepage_hero_presentations
  where id = target_id;

  if not found then
    return false;
  end if;

  if not public.homepage_hero_assets_ready(
    target_hero.model_storage_path,
    target_hero.poster_storage_path
  ) then
    raise exception 'Homepage Hero assets must exist and satisfy approved Storage constraints before publishing.'
      using errcode = '23514';
  end if;

  update public.homepage_hero_presentations
  set is_active = false
  where is_active
    and id <> target_id;

  update public.homepage_hero_presentations
  set is_active = true,
      published_at = statement_timestamp()
  where id = target_id;

  return found;
end;
$$;

revoke all on function public.publish_homepage_hero(uuid)
  from public, anon, authenticated;
grant execute on function public.publish_homepage_hero(uuid)
  to service_role;
