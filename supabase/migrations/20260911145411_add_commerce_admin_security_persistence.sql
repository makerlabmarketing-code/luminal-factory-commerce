-- ERP -> Commerce Management security persistence.
-- Prepared for review only until explicitly approved for Production apply.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table private.commerce_admin_replay_nonces (
  key_id text not null,
  nonce text not null,
  request_id uuid not null,
  accepted_at timestamptz not null default statement_timestamp(),
  expires_at timestamptz not null,
  primary key (key_id, nonce),
  constraint commerce_admin_replay_key_id_check
    check (char_length(key_id) between 1 and 128 and key_id ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_replay_nonce_check
    check (char_length(nonce) between 22 and 128 and nonce ~ '^[A-Za-z0-9_-]+$'),
  constraint commerce_admin_replay_expiry_check
    check (expires_at > accepted_at)
);

create index commerce_admin_replay_nonces_expiry_idx
  on private.commerce_admin_replay_nonces(expires_at);

alter table private.commerce_admin_replay_nonces enable row level security;
revoke all on table private.commerce_admin_replay_nonces from public, anon, authenticated;
grant select, insert, delete on table private.commerce_admin_replay_nonces to service_role;

create function public.consume_commerce_admin_nonce(
  p_key_id text,
  p_nonce text,
  p_request_id uuid
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted boolean := false;
  v_now timestamptz := statement_timestamp();
begin
  if p_key_id is null
    or char_length(p_key_id) not between 1 and 128
    or p_key_id !~ '^[A-Za-z0-9._:-]+$'
  then
    raise exception 'invalid Commerce Admin key id' using errcode = '22023';
  end if;

  if p_nonce is null
    or char_length(p_nonce) not between 22 and 128
    or p_nonce !~ '^[A-Za-z0-9_-]+$'
  then
    raise exception 'invalid Commerce Admin nonce' using errcode = '22023';
  end if;

  if p_request_id is null then
    raise exception 'invalid Commerce Admin request id' using errcode = '22023';
  end if;

  insert into private.commerce_admin_replay_nonces (
    key_id,
    nonce,
    request_id,
    accepted_at,
    expires_at
  )
  values (
    p_key_id,
    p_nonce,
    p_request_id,
    v_now,
    v_now + interval '10 minutes'
  )
  on conflict (key_id, nonce) do nothing
  returning true into v_inserted;

  return coalesce(v_inserted, false);
end;
$$;

revoke execute on function public.consume_commerce_admin_nonce(text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.consume_commerce_admin_nonce(text, text, uuid)
  to service_role;

create table private.commerce_admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default statement_timestamp(),
  request_id uuid not null,
  client_id text not null,
  key_id text not null,
  actor_id text not null,
  workspace_id text not null,
  scope text not null,
  operation text not null,
  target_type text not null,
  target_id text,
  outcome text not null,
  http_status integer,
  failure_code text,
  constraint commerce_admin_audit_client_id_check
    check (char_length(client_id) between 1 and 128 and client_id ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_key_id_check
    check (char_length(key_id) between 1 and 128 and key_id ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_actor_id_check
    check (char_length(actor_id) between 1 and 128 and actor_id ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_workspace_id_check
    check (char_length(workspace_id) between 1 and 128 and workspace_id ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_scope_check
    check (char_length(scope) between 1 and 128 and scope ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_operation_check
    check (char_length(operation) between 1 and 96 and operation ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_target_type_check
    check (char_length(target_type) between 1 and 96 and target_type ~ '^[A-Za-z0-9._:-]+$'),
  constraint commerce_admin_audit_target_id_check
    check (target_id is null or char_length(target_id) between 1 and 160),
  constraint commerce_admin_audit_outcome_check
    check (outcome in ('denied', 'succeeded', 'failed')),
  constraint commerce_admin_audit_http_status_check
    check (http_status is null or http_status between 100 and 599),
  constraint commerce_admin_audit_failure_code_check
    check (
      failure_code is null
      or (char_length(failure_code) between 1 and 96 and failure_code ~ '^[A-Za-z0-9._:-]+$')
    )
);

create index commerce_admin_audit_events_occurred_idx
  on private.commerce_admin_audit_events(occurred_at desc);
create index commerce_admin_audit_events_request_idx
  on private.commerce_admin_audit_events(request_id);

alter table private.commerce_admin_audit_events enable row level security;
revoke all on table private.commerce_admin_audit_events from public, anon, authenticated;
grant select, insert on table private.commerce_admin_audit_events to service_role;

create function public.record_commerce_admin_audit_event(
  p_request_id uuid,
  p_client_id text,
  p_key_id text,
  p_actor_id text,
  p_workspace_id text,
  p_scope text,
  p_operation text,
  p_target_type text,
  p_target_id text,
  p_outcome text,
  p_http_status integer,
  p_failure_code text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into private.commerce_admin_audit_events (
    request_id,
    client_id,
    key_id,
    actor_id,
    workspace_id,
    scope,
    operation,
    target_type,
    target_id,
    outcome,
    http_status,
    failure_code
  )
  values (
    p_request_id,
    p_client_id,
    p_key_id,
    p_actor_id,
    p_workspace_id,
    p_scope,
    p_operation,
    p_target_type,
    p_target_id,
    p_outcome,
    p_http_status,
    p_failure_code
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke execute on function public.record_commerce_admin_audit_event(
  uuid, text, text, text, text, text, text, text, text, text, integer, text
) from public, anon, authenticated;
grant execute on function public.record_commerce_admin_audit_event(
  uuid, text, text, text, text, text, text, text, text, text, integer, text
) to service_role;

select cron.schedule(
  'commerce-admin-replay-cleanup',
  '17 * * * *',
  $cleanup$
    delete from private.commerce_admin_replay_nonces
    where expires_at <= statement_timestamp();
  $cleanup$
);

select cron.schedule(
  'commerce-admin-audit-cleanup',
  '41 3 * * *',
  $cleanup$
    delete from private.commerce_admin_audit_events
    where occurred_at < statement_timestamp() - interval '180 days';
  $cleanup$
);
