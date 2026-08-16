-- Phase 6 Slice A: durable, server-only guest cart request limiting.
-- The database owns fixed-window policy so application input cannot raise limits.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.guest_cart_rate_limits (
  source_key_hash text not null,
  bucket text not null
    check (bucket in ('request', 'create', 'mutation')),
  window_started_at timestamptz not null,
  request_count integer not null
    check (request_count between 1 and 240),
  expires_at timestamptz not null,
  updated_at timestamptz not null default statement_timestamp(),
  primary key (source_key_hash, bucket, window_started_at),
  constraint guest_cart_rate_limits_source_key_hash_check
    check (source_key_hash ~ '^[0-9a-f]{64}$'),
  constraint guest_cart_rate_limits_expiry_check
    check (expires_at > window_started_at)
);

create index guest_cart_rate_limits_expiry_idx
  on private.guest_cart_rate_limits(expires_at);

alter table private.guest_cart_rate_limits enable row level security;

-- No RLS policy is intentional. Only the server-side service role can use the
-- table, and browser roles cannot reach the private schema or RPC.
revoke all on table private.guest_cart_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.guest_cart_rate_limits to service_role;

create function public.consume_guest_cart_rate_limit(
  p_key_hash text,
  p_bucket text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_limit integer;
  v_window_started_at timestamptz;
  v_allowed boolean := false;
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid guest cart rate-limit key' using errcode = '22023';
  end if;

  v_limit := case p_bucket
    when 'request' then 240
    when 'create' then 20
    when 'mutation' then 120
    else null
  end;

  if v_limit is null then
    raise exception 'invalid guest cart rate-limit bucket' using errcode = '22023';
  end if;

  v_window_started_at :=
    date_trunc('hour', statement_timestamp() at time zone 'UTC') at time zone 'UTC';

  insert into private.guest_cart_rate_limits (
    source_key_hash,
    bucket,
    window_started_at,
    request_count,
    expires_at,
    updated_at
  )
  values (
    p_key_hash,
    p_bucket,
    v_window_started_at,
    1,
    v_window_started_at + interval '2 hours',
    statement_timestamp()
  )
  on conflict (source_key_hash, bucket, window_started_at)
  do update
    set request_count = private.guest_cart_rate_limits.request_count + 1,
        updated_at = statement_timestamp()
    where private.guest_cart_rate_limits.request_count < v_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke execute on function public.consume_guest_cart_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.consume_guest_cart_rate_limit(text, text)
  to service_role;

-- Supabase Cron runs inside the existing database and adds no external vendor.
-- No extension version is pinned because hosted Supabase now selects its default.
create extension if not exists pg_cron;

select cron.schedule(
  'commerce-guest-cart-rate-limit-cleanup',
  '17 * * * *',
  $cleanup$
    delete from private.guest_cart_rate_limits
    where expires_at <= statement_timestamp();
  $cleanup$
);
