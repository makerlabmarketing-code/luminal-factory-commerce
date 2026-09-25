# Homepage Hero Asset Storage Production Runbook

Status: `OWNER_APPROVAL_REQUIRED`  
Date: 2026-09-25  
Migration gate: `HERO-ASSET-PUBLISH-GUARD-01`  
Asset-write gate: `HERO-ASSET-STORAGE-01`

## Purpose

Restore the trusted Homepage Hero publish invariant before ERP Hero management
is activated.

The application routes and signed-upload contract are already deployed behind
`COMMERCE_ADMIN_INTEGRATION_ENABLED=false`. This runbook does **not** enable
that runtime and does not provision an HMAC credential.

## Verified baseline

Read-only checks on 2026-09-25 confirmed:

- `homepage-hero` bucket is public;
- bucket size limit is 10 MiB;
- allowed MIME types include GLB and approved poster formats;
- the bucket contains zero objects;
- one inactive Homepage Hero draft exists and references
  `models/meowhe-hero.glb`;
- Homepage currently falls back to bundled `/models/meowhe-hero.glb`;
- `private.commerce_admin_replay_nonces`,
  `private.commerce_admin_idempotency_receipts` and
  `private.commerce_admin_audit_events` exist;
- `manage_homepage_hero`, `consume_commerce_admin_nonce` and audit RPCs
  exist;
- the original helper functions remain, but the
  `homepage_hero_require_assets_before_publish` trigger is absent;
- Production Commerce Admin API returns `INTEGRATION_DISABLED`.

## Scope

Apply only:

`supabase/migrations/20260925062000_restore_homepage_hero_asset_publish_guard.sql`

The migration:

1. validates Storage object existence, MIME metadata and 1..10 MiB size;
2. restores the active-Hero trigger;
3. validates the target asset in `publish_homepage_hero` **before**
   deactivating the previous active Hero;
4. keeps all helper/RPC execution browser-denied and service-role-only.

It does not upload a file, change a Hero row, enable runtime or provision a
secret.

## Preflight

Abort if any expected baseline changes.

```sql
select jsonb_build_object(
  'hero_rows', (select count(*) from public.homepage_hero_presentations),
  'active_hero_rows', (select count(*) from public.homepage_hero_presentations where is_active),
  'hero_storage_objects', (select count(*) from storage.objects where bucket_id = 'homepage-hero'),
  'guard_trigger', exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'homepage_hero_presentations'
      and t.tgname = 'homepage_hero_require_assets_before_publish'
      and not t.tgisinternal
  )
) as preflight;
```

Expected before this gate:

- Hero rows: 1
- active rows: 0
- Storage objects: 0
- guard trigger: false

Also confirm the live Admin route still returns `INTEGRATION_DISABLED`.

## Apply

Apply the reviewed migration once through the Supabase migration boundary.
Record the actual Production migration ledger version returned by Supabase.

Do not apply a second migration or upload an asset under this gate.

## Behavioral validation

The migration must reject an attempted publish of a temporary draft whose GLB
path does not exist. Use an exception-catching transaction block so no fixture
survives:

```sql
do $$
declare
  fixture_id uuid;
  blocked boolean := false;
begin
  insert into public.homepage_hero_presentations (
    name,
    model_storage_path,
    tint,
    exposure,
    shadow_intensity,
    shadow_softness,
    auto_rotate,
    auto_rotate_delay_ms,
    rotation_per_second_deg,
    camera_theta_deg,
    camera_phi_deg,
    camera_radius_percent,
    camera_intro_radius_percent,
    camera_min_radius_percent,
    camera_max_radius_percent,
    camera_field_of_view_deg,
    camera_min_field_of_view_deg,
    camera_max_field_of_view_deg
  )
  values (
    'Hero guard fixture',
    'models/does-not-exist.glb',
    null,
    1.08,
    1,
    0.72,
    false,
    700,
    3,
    12,
    82,
    103,
    103,
    78,
    155,
    29,
    22,
    42
  )
  returning id into fixture_id;

  begin
    perform public.publish_homepage_hero(fixture_id);
  exception
    when check_violation then
      blocked := true;
  end;

  if not blocked then
    raise exception 'Homepage Hero publish guard did not reject a missing asset';
  end if;

  delete from public.homepage_hero_presentations where id = fixture_id;
end;
$$;
```

## Postflight

Confirm:

- exactly one original Hero row remains;
- zero active Hero rows remain;
- zero Storage objects remain;
- guard trigger exists;
- `homepage_hero_asset_object_ready`,
  `homepage_hero_assets_ready` and `publish_homepage_hero` exist;
- anon/authenticated have no execute grant on the new helpers;
- Commerce Admin runtime is still disabled;
- Homepage still renders using the local fallback.

## Rollback

Rollback is only for an immediate migration regression before Hero Admin live
activation. Restore the exact pre-gate behavior:

1. drop `homepage_hero_require_assets_before_publish` trigger;
2. drop `homepage_hero_asset_object_ready(text,text)`;
3. restore the previous existence-only `homepage_hero_assets_ready`;
4. restore the previous trigger function definition;
5. restore the previous `publish_homepage_hero` function that does not contain
   the explicit asset precheck.

Do not use rollback as a way to publish a missing or invalid asset.

## Next gate

After this migration passes, the next Production write is separate:

`HERO-ASSET-STORAGE-01`

That gate uploads one approved derived web GLB into `homepage-hero`, verifies
its Storage metadata and updates/selects a draft path if needed. It does not
activate ERP↔Commerce runtime by itself.
