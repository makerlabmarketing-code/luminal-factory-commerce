create or replace function public.homepage_hero_assets_ready(
  model_path text,
  poster_path text default null
)
returns boolean
language sql
stable
set search_path = public, storage
as $$
  select
    exists (
      select 1
      from storage.objects
      where bucket_id = 'homepage-hero'
        and name = model_path
    )
    and (
      poster_path is null
      or exists (
        select 1
        from storage.objects
        where bucket_id = 'homepage-hero'
          and name = poster_path
      )
    );
$$;

revoke all on function public.homepage_hero_assets_ready(text, text) from public, anon, authenticated;
grant execute on function public.homepage_hero_assets_ready(text, text) to service_role;

create or replace function public.homepage_hero_require_assets_before_publish()
returns trigger
language plpgsql
set search_path = public, storage
as $$
begin
  if (new.is_active or new.published_at is not null)
    and not public.homepage_hero_assets_ready(new.model_storage_path, new.poster_storage_path)
  then
    raise exception using
      errcode = '23514',
      message = 'Homepage Hero assets must exist in approved Storage before publishing.';
  end if;

  return new;
end;
$$;

revoke all on function public.homepage_hero_require_assets_before_publish() from public, anon, authenticated;
grant execute on function public.homepage_hero_require_assets_before_publish() to service_role;

drop trigger if exists homepage_hero_require_assets_before_publish on public.homepage_hero_presentations;

create trigger homepage_hero_require_assets_before_publish
before insert or update of model_storage_path, poster_storage_path, is_active, published_at
on public.homepage_hero_presentations
for each row
execute function public.homepage_hero_require_assets_before_publish();
