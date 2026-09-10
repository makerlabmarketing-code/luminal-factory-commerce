create table public.homepage_hero_presentations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  model_storage_path text not null,
  poster_storage_path text,
  tint text,
  exposure double precision not null default 1.08,
  shadow_intensity double precision not null default 1,
  shadow_softness double precision not null default 0.72,
  auto_rotate boolean not null default true,
  auto_rotate_delay_ms integer not null default 3200,
  rotation_per_second_deg double precision not null default 5,
  camera_theta_deg double precision not null default 0,
  camera_phi_deg double precision not null default 76,
  camera_radius_percent double precision not null default 104,
  camera_intro_radius_percent double precision not null default 122,
  camera_min_radius_percent double precision not null default 78,
  camera_max_radius_percent double precision not null default 155,
  camera_field_of_view_deg double precision not null default 29,
  camera_min_field_of_view_deg double precision not null default 22,
  camera_max_field_of_view_deg double precision not null default 42,
  is_active boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_hero_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint homepage_hero_model_path check (
    char_length(model_storage_path) between 1 and 512
    and model_storage_path !~ '^/'
    and model_storage_path !~ '//'
    and model_storage_path !~ '(^|/)\.\.(/|$)'
    and model_storage_path ~* '\.glb$'
  ),
  constraint homepage_hero_poster_path check (
    poster_storage_path is null
    or (
      char_length(poster_storage_path) between 1 and 512
      and poster_storage_path !~ '^/'
      and poster_storage_path !~ '//'
      and poster_storage_path !~ '(^|/)\.\.(/|$)'
      and poster_storage_path ~* '\.(webp|avif|png)$'
    )
  ),
  constraint homepage_hero_tint_hex check (tint is null or tint ~ '^#[0-9A-Fa-f]{6}$'),
  constraint homepage_hero_exposure_range check (exposure between 0.4 and 2.5),
  constraint homepage_hero_shadow_intensity_range check (shadow_intensity between 0 and 2),
  constraint homepage_hero_shadow_softness_range check (shadow_softness between 0 and 1),
  constraint homepage_hero_auto_rotate_delay_range check (auto_rotate_delay_ms between 0 and 30000),
  constraint homepage_hero_rotation_speed_range check (rotation_per_second_deg between 0 and 30),
  constraint homepage_hero_camera_theta_range check (camera_theta_deg between -360 and 360),
  constraint homepage_hero_camera_phi_range check (camera_phi_deg between 5 and 175),
  constraint homepage_hero_camera_radius_range check (camera_radius_percent between 50 and 250),
  constraint homepage_hero_camera_intro_radius_range check (camera_intro_radius_percent between 50 and 250),
  constraint homepage_hero_camera_min_radius_range check (camera_min_radius_percent between 40 and 250),
  constraint homepage_hero_camera_max_radius_range check (camera_max_radius_percent between 50 and 300),
  constraint homepage_hero_camera_radius_order check (camera_min_radius_percent <= camera_radius_percent and camera_radius_percent <= camera_max_radius_percent),
  constraint homepage_hero_camera_fov_range check (camera_field_of_view_deg between 10 and 70),
  constraint homepage_hero_camera_min_fov_range check (camera_min_field_of_view_deg between 8 and 70),
  constraint homepage_hero_camera_max_fov_range check (camera_max_field_of_view_deg between 10 and 90),
  constraint homepage_hero_camera_fov_order check (camera_min_field_of_view_deg <= camera_field_of_view_deg and camera_field_of_view_deg <= camera_max_field_of_view_deg)
);

create unique index homepage_hero_one_active_uidx
  on public.homepage_hero_presentations (is_active)
  where is_active;

create index homepage_hero_published_idx
  on public.homepage_hero_presentations (published_at desc)
  where is_active;

create trigger homepage_hero_presentations_set_updated_at
before update on public.homepage_hero_presentations
for each row execute function public.commerce_set_updated_at();

alter table public.homepage_hero_presentations enable row level security;

revoke all on public.homepage_hero_presentations from public, anon, authenticated;
grant select on public.homepage_hero_presentations to anon, authenticated;
grant all on public.homepage_hero_presentations to service_role;

create policy "Public can read active published homepage hero"
on public.homepage_hero_presentations
for select
to anon, authenticated
using (is_active and published_at is not null and published_at <= now());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'homepage-hero',
  'homepage-hero',
  true,
  10485760,
  array['model/gltf-binary', 'application/octet-stream', 'image/webp', 'image/avif', 'image/png']
)
on conflict (id) do nothing;
