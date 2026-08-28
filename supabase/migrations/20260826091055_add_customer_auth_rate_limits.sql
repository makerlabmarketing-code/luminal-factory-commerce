-- Phase 6 Slice B: durable, server-only email OTP abuse limiting.
-- Only keyed hashes are stored; raw source addresses and email addresses never
-- enter the limiter table or RPC.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.customer_auth_rate_limits (
  key_hash text not null,
  bucket text not null
    check (bucket in ('otp_email_15m', 'otp_source_hour', 'verify_source_15m')),
  window_started_at timestamptz not null,
  request_count integer not null
    check (request_count between 1 and 10),
  expires_at timestamptz not null,
  updated_at timestamptz not null default statement_timestamp(),
  primary key (key_hash, bucket, window_started_at),
  constraint customer_auth_rate_limits_key_hash_check
    check (key_hash ~ '^[0-9a-f]{64}$'),
  constraint customer_auth_rate_limits_expiry_check
    check (expires_at > window_started_at)
);

create index customer_auth_rate_limits_expiry_idx
  on private.customer_auth_rate_limits(expires_at);

alter table private.customer_auth_rate_limits enable row level security;

-- No RLS policy is intentional. Browser roles cannot reach this private table
-- or its RPC; only the Commerce server credential receives explicit access.
revoke all on table private.customer_auth_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on table private.customer_auth_rate_limits to service_role;

create function public.consume_customer_auth_rate_limit(
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
  v_window_length interval;
  v_allowed boolean := false;
  v_now timestamptz := statement_timestamp();
begin
  if p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid customer Auth rate-limit key' using errcode = '22023';
  end if;

  v_limit := case p_bucket
    when 'otp_email_15m' then 3
    when 'otp_source_hour' then 10
    when 'verify_source_15m' then 10
    else null
  end;

  if v_limit is null then
    raise exception 'invalid customer Auth rate-limit bucket' using errcode = '22023';
  end if;

  if p_bucket = 'otp_source_hour' then
    v_window_started_at := date_trunc('hour', v_now at time zone 'UTC') at time zone 'UTC';
    v_window_length := interval '1 hour';
  else
    v_window_started_at :=
      date_trunc('hour', v_now at time zone 'UTC') at time zone 'UTC'
      + make_interval(mins => (extract(minute from v_now)::integer / 15) * 15);
    v_window_length := interval '15 minutes';
  end if;

  insert into private.customer_auth_rate_limits (
    key_hash,
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
    v_window_started_at + (v_window_length * 2),
    v_now
  )
  on conflict (key_hash, bucket, window_started_at)
  do update
    set request_count = private.customer_auth_rate_limits.request_count + 1,
        updated_at = v_now
    where private.customer_auth_rate_limits.request_count < v_limit
  returning true into v_allowed;

  return coalesce(v_allowed, false);
end;
$$;

revoke execute on function public.consume_customer_auth_rate_limit(text, text)
  from public, anon, authenticated;
grant execute on function public.consume_customer_auth_rate_limit(text, text)
  to service_role;

select cron.schedule(
  'commerce-customer-auth-rate-limit-cleanup',
  '23 * * * *',
  $cleanup$
    delete from private.customer_auth_rate_limits
    where expires_at <= statement_timestamp();
  $cleanup$
);
