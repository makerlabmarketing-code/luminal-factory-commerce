create or replace function public.publish_homepage_hero(target_id uuid)
returns boolean
language plpgsql
set search_path = public, storage
as $$
declare
  target_exists boolean;
begin
  lock table public.homepage_hero_presentations in share row exclusive mode;

  select exists (
    select 1
    from public.homepage_hero_presentations
    where id = target_id
  ) into target_exists;

  if not target_exists then
    return false;
  end if;

  update public.homepage_hero_presentations
  set is_active = false
  where is_active
    and id <> target_id;

  update public.homepage_hero_presentations
  set is_active = true,
      published_at = now()
  where id = target_id;

  return found;
end;
$$;

revoke all on function public.publish_homepage_hero(uuid) from public, anon, authenticated;
grant execute on function public.publish_homepage_hero(uuid) to service_role;

create or replace function public.unpublish_homepage_hero(target_id uuid)
returns boolean
language sql
set search_path = public
as $$
  update public.homepage_hero_presentations
  set is_active = false
  where id = target_id
    and is_active
  returning true;
$$;

revoke all on function public.unpublish_homepage_hero(uuid) from public, anon, authenticated;
grant execute on function public.unpublish_homepage_hero(uuid) to service_role;
