-- Raffle detail + guest-email entry foundation.
-- Runtime remains default-off. This migration does not select winners, reserve
-- inventory, create orders/payments, or grant ERP mutation authority.

create table public.raffles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  product_id uuid references public.products(id) on delete restrict,
  title text not null,
  summary text,
  rules_summary text,
  status text not null default 'DRAFT'
    check (status in (
      'DRAFT',
      'SCHEDULED',
      'OPEN',
      'CLOSED',
      'DRAWING',
      'DRAWN',
      'PAYMENT_PENDING',
      'FULFILLING',
      'COMPLETED',
      'CANCELLED'
    )),
  rules_version text not null,
  opens_at timestamptz,
  closes_at timestamptz,
  is_published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp(),
  constraint raffles_slug_check
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and length(slug) between 1 and 120),
  constraint raffles_title_check
    check (length(btrim(title)) between 1 and 180),
  constraint raffles_rules_version_check
    check (length(btrim(rules_version)) between 1 and 64),
  constraint raffles_window_check
    check (opens_at is null or closes_at is null or closes_at > opens_at),
  constraint raffles_publication_check
    check ((not is_published and published_at is null) or (is_published and published_at is not null)),
  constraint raffles_open_window_check
    check (status <> 'OPEN' or (opens_at is not null and closes_at is not null))
);

create index raffles_product_id_idx on public.raffles(product_id)
  where product_id is not null;
create index raffles_public_listing_idx on public.raffles(published_at desc, opens_at desc)
  where is_published;

create trigger raffles_set_updated_at
before update on public.raffles
for each row execute function public.commerce_set_updated_at();

alter table public.raffles enable row level security;

revoke all on table public.raffles from public, anon, authenticated;
grant select on table public.raffles to anon, authenticated;
grant select, insert, update, delete on table public.raffles to service_role;

create policy "Public can read published raffles"
on public.raffles
for select
to anon, authenticated
using (
  is_published
  and published_at is not null
  and published_at <= statement_timestamp()
);

create table public.raffle_entries (
  id uuid primary key default gen_random_uuid(),
  raffle_id uuid not null references public.raffles(id) on delete restrict,
  email_normalized text not null,
  contact_email text not null,
  display_name text not null,
  rules_version text not null,
  accepted_at timestamptz not null default statement_timestamp(),
  request_token_hash text not null,
  request_fingerprint_hash text not null,
  created_at timestamptz not null default statement_timestamp(),
  constraint raffle_entries_raffle_email_key unique (raffle_id, email_normalized),
  constraint raffle_entries_raffle_request_token_key unique (raffle_id, request_token_hash),
  constraint raffle_entries_email_normalized_check
    check (
      email_normalized = lower(btrim(email_normalized))
      and length(email_normalized) between 3 and 254
      and email_normalized ~ '^[^[:space:]@]+@[^[:space:]@]+$'
    ),
  constraint raffle_entries_contact_email_check
    check (contact_email = email_normalized),
  constraint raffle_entries_display_name_check
    check (length(btrim(display_name)) between 2 and 120),
  constraint raffle_entries_rules_version_check
    check (length(btrim(rules_version)) between 1 and 64),
  constraint raffle_entries_request_token_hash_check
    check (request_token_hash ~ '^[0-9a-f]{64}$'),
  constraint raffle_entries_request_fingerprint_hash_check
    check (request_fingerprint_hash ~ '^[0-9a-f]{64}$')
);

alter table public.raffle_entries enable row level security;

-- No browser policy is intentional. Entrant records are server-only PII.
revoke all on table public.raffle_entries from public, anon, authenticated;
grant select, insert on table public.raffle_entries to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.raffle_entry_rate_limits (
  key_hash text not null,
  bucket text not null
    check (bucket in ('source_hour', 'email_raffle_15m')),
  window_started_at timestamptz not null,
  request_count integer not null
    check (request_count between 1 and 30),
  expires_at timestamptz not null,
  updated_at timestamptz not null default statement_timestamp(),
  primary key (key_hash, bucket, window_started_at),
  constraint raffle_entry_rate_limits_key_hash_check
    check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint raffle_entry_rate_limits_expiry_check
    check (expires_at > window_started_at)
);

create index raffle_entry_rate_limits_expiry_idx
  on private.raffle_entry_rate_limits(expires_at);

alter table private.raffle_entry_rate_limits enable row level security;

revoke all on table private.raffle_entry_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.raffle_entry_rate_limits to service_role;

create function public.consume_raffle_entry_rate_limit(
  p_key_hash text,
  p_bucket text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '3s'
as $$
declare
  v_limit integer;
  v_window_started_at timestamptz;
  v_window_length interval;
  v_allowed boolean := false;
  v_now timestamptz := statement_timestamp();
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid raffle entry rate-limit key' using errcode = '22023';
  end if;

  if p_bucket = 'source_hour' then
    v_limit := 30;
    v_window_started_at := date_trunc('hour', v_now at time zone 'UTC') at time zone 'UTC';
    v_window_length := interval '1 hour';
  elsif p_bucket = 'email_raffle_15m' then
    v_limit := 5;
    v_window_started_at :=
      date_trunc('hour', v_now at time zone 'UTC') at time zone 'UTC'
      + make_interval(mins => (extract(minute from v_now)::integer / 15) * 15);
    v_window_length := interval '15 minutes';
  else
    raise exception 'invalid raffle entry rate-limit bucket' using errcode = '22023';
  end if;

  insert into private.raffle_entry_rate_limits (
    key_hash,
    bucket,
    window_started_at,
    request_count,
    expires_at,
    updated_at
  ) values (
    p_key_hash,
    p_bucket,
    v_window_started_at,
    1,
    v_window_started_at + (v_window_length * 2),
    v_now
  )
  on conflict (key_hash, bucket, window_started_at)
  do update
    set request_count = private.raffle_entry_rate_limits.request_count + 1,
        updated_at = v_now
    where private.raffle_entry_rate_limits.request_count < v_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke execute on function public.consume_raffle_entry_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.consume_raffle_entry_rate_limit(text, text)
  to service_role;

create function public.submit_guest_raffle_entry(
  p_raffle_id uuid,
  p_email text,
  p_display_name text,
  p_rules_version text,
  p_request_token_hash text,
  p_request_fingerprint_hash text
)
returns table (
  entry_state text,
  entry_reference uuid
)
language plpgsql
security invoker
set search_path = ''
set statement_timeout = '5s'
set lock_timeout = '2s'
as $$
declare
  v_now timestamptz := statement_timestamp();
  v_email text := lower(btrim(p_email));
  v_display_name text := btrim(p_display_name);
  v_raffle public.raffles%rowtype;
  v_existing_id uuid;
  v_existing_fingerprint text;
  v_entry_id uuid;
begin
  if p_raffle_id is null
    or p_email is null
    or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
    or length(v_email) not between 3 and 254
    or p_display_name is null
    or length(v_display_name) not between 2 and 120
    or p_rules_version is null
    or length(btrim(p_rules_version)) not between 1 and 64
    or p_request_token_hash is null
    or p_request_token_hash !~ '^[0-9a-f]{64}$'
    or p_request_fingerprint_hash is null
    or p_request_fingerprint_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception 'invalid raffle entry input' using errcode = '22023';
  end if;

  -- Email then token is a fixed lock order. It serializes duplicate-entry and
  -- replay races without exposing entrant rows to browser roles.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('raffle-entry-email:' || p_raffle_id::text || ':' || v_email, 0)
  );
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('raffle-entry-token:' || p_raffle_id::text || ':' || p_request_token_hash, 0)
  );

  select entries.id, entries.request_fingerprint_hash
  into v_existing_id, v_existing_fingerprint
  from public.raffle_entries as entries
  where entries.raffle_id = p_raffle_id
    and entries.request_token_hash = p_request_token_hash;

  if found then
    if v_existing_fingerprint <> p_request_fingerprint_hash then
      raise exception 'raffle entry request token conflict' using errcode = '22023';
    end if;
    return query select 'submitted'::text, v_existing_id;
    return;
  end if;

  select raffles.*
  into v_raffle
  from public.raffles as raffles
  where raffles.id = p_raffle_id
  for update;

  if not found
    or not v_raffle.is_published
    or v_raffle.published_at is null
    or v_raffle.published_at > v_now
    or v_raffle.status <> 'OPEN'
    or v_raffle.opens_at is null
    or v_raffle.closes_at is null
    or v_now < v_raffle.opens_at
    or v_now >= v_raffle.closes_at
    or v_raffle.rules_version <> btrim(p_rules_version)
  then
    return query select 'raffle_not_open'::text, null::uuid;
    return;
  end if;

  if exists (
    select 1
    from public.raffle_entries as entries
    where entries.raffle_id = p_raffle_id
      and entries.email_normalized = v_email
  ) then
    return query select 'already_entered'::text, null::uuid;
    return;
  end if;

  insert into public.raffle_entries (
    raffle_id,
    email_normalized,
    contact_email,
    display_name,
    rules_version,
    accepted_at,
    request_token_hash,
    request_fingerprint_hash,
    created_at
  ) values (
    p_raffle_id,
    v_email,
    v_email,
    v_display_name,
    btrim(p_rules_version),
    v_now,
    p_request_token_hash,
    p_request_fingerprint_hash,
    v_now
  )
  returning id into v_entry_id;

  return query select 'submitted'::text, v_entry_id;
end;
$$;

revoke execute on function public.submit_guest_raffle_entry(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.submit_guest_raffle_entry(uuid, text, text, text, text, text)
  to service_role;

select cron.schedule(
  'commerce-raffle-entry-rate-limit-cleanup',
  '31 * * * *',
  $cleanup$
    delete from private.raffle_entry_rate_limits
    where expires_at <= statement_timestamp();
  $cleanup$
);
