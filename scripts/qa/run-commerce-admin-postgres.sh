#!/usr/bin/env bash
set -Eeuo pipefail

# Require an isolated, local, throwaway PostgreSQL database. No Supabase connection allowed.
if [[ "${COMMERCE_ADMIN_DB_QA_LOCAL_ONLY:-}" != "true"
   || "${PGHOST:-}" != "127.0.0.1"
   || "${PGPORT:-}" != "5432"
   || "${PGDATABASE:-}" != "commerce_admin_contract_ci"
   || "${PGUSER:-}" != "postgres" ]]; then
  echo 'Refusing to run: Commerce SQL integration tests require the isolated local CI PostgreSQL service.' >&2
  exit 2
fi
cd "$(dirname "$0")/../.."
psql_ci() { psql -X -v ON_ERROR_STOP=1 -q "$@"; }

# Match Supabase roles needed by the original, unchanged migration SQL.
psql_ci <<'SQL'
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to service_role;
create schema storage;
SQL

# Reuse production-owned schema and function sources, never an independently copied SQL implementation.
# The two excluded blocks are Supabase-specific setup: Storage bucket, updated_at trigger,
# and pg_cron schedules. All tables, constraints, grants, RLS and RPC functions below are original.
if [[ "$(grep -c '^create trigger homepage_hero_presentations_set_updated_at' supabase/migrations/20260910103000_create_homepage_hero_presentations.sql)" != 1 ]]; then
  echo 'Homepage Hero migration shape changed. Refusing partial SQL extraction.' >&2
  exit 1
fi
sed '/^create trigger homepage_hero_presentations_set_updated_at/,$d' \
  supabase/migrations/20260910103000_create_homepage_hero_presentations.sql | psql_ci

psql_ci <<'SQL'
alter table public.homepage_hero_presentations enable row level security;
revoke all on public.homepage_hero_presentations from public, anon, authenticated;
grant all on public.homepage_hero_presentations to service_role;
SQL

psql_ci -f supabase/migrations/20260911101000_add_homepage_hero_publish_rpc.sql
for file in \
  supabase/migrations/20260911145411_add_commerce_admin_security_persistence.sql \
  supabase/migrations/20260912150000_add_commerce_admin_hero_idempotency.sql; do
  if [[ "$(grep -c '^select cron.schedule(' "$file")" -lt 1 ]]; then
    echo "Cannot locate pg_cron-only tail in $file; refusing execution." >&2
    exit 1
  fi
  sed '/^select cron.schedule(/,$d' "$file" | psql_ci
done

# The SQL assertions exercise the actual migration-defined functions under Supabase-like role
# privileges and verify that a draft is created exactly once.
psql_ci -f scripts/qa/commerce-admin-postgres-assertions.sql

scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

# Two independent sessions try to consume the same nonce concurrently.
for i in 1 2; do
  (
    psql -X -A -t -v ON_ERROR_STOP=1 -q <<'SQL' >"$scratch/nonce.$i"
set role service_role;
select public.consume_commerce_admin_nonce(
  'ci-concurrent-key', 'ci_nonce_concurrency_1234567890',
  '66666666-6666-4666-8666-666666666666'::uuid
);
SQL
  ) &
  pids[$i]=$!
done
for i in 1 2; do wait "${pids[$i]}"; done
if [[ "$(cat "$scratch/nonce.1" "$scratch/nonce.2" | sort | tr '\n' ' ')" != 'f t ' ]]; then
  echo 'Concurrent nonce consumption did not yield exactly one success.' >&2
  exit 1
fi

# Two independent sessions retry the same idempotent draft operation with identical bytes.
for i in 1 2; do
  (
    psql -X -A -t -v ON_ERROR_STOP=1 -q <<'SQL' >"$scratch/draft.$i"
set role service_role;
select public.manage_homepage_hero(
 '77777777-7777-4777-8777-777777777777'::uuid,
 'ci-client-concurrent', 'create_draft', null, repeat('b',64), public.ci_test_hero_input()
)->>'id';
SQL
  ) &
  pids[$i]=$!
done
for i in 1 2; do wait "${pids[$i]}"; done
if [[ "$(cat "$scratch/draft.1")" != "$(cat "$scratch/draft.2")" || -z "$(cat "$scratch/draft.1")" ]]; then
  echo 'Concurrent idempotency retry did not return the same draft id.' >&2
  exit 1
fi

psql_ci <<'SQL'
do $$
begin
  if (select count(*) from private.commerce_admin_replay_nonces where key_id='ci-concurrent-key') <> 1 then
    raise exception 'Concurrent nonce produced more than one persisted row';
  end if;
  if (select count(*) from private.commerce_admin_idempotency_receipts where client_id='ci-client-concurrent') <> 1 then
    raise exception 'Concurrent idempotency produced multiple receipts';
  end if;
  if (select count(*) from public.homepage_hero_presentations) <> 2 then
    raise exception 'Concurrent create unexpectedly generated extra Hero drafts';
  end if;
end $$;
truncate table private.commerce_admin_replay_nonces, private.commerce_admin_idempotency_receipts,
  private.commerce_admin_audit_events, public.homepage_hero_presentations;
do $$
begin
  if (select count(*) from private.commerce_admin_replay_nonces) <> 0
  or (select count(*) from private.commerce_admin_idempotency_receipts) <> 0
  or (select count(*) from public.homepage_hero_presentations) <> 0 then
    raise exception 'PostgreSQL synthetic fixture cleanup incomplete';
  end if;
end $$;
SQL
echo 'I006_POSTGRES_CONTRACT_PASS: migration SQL; role isolation; atomic nonce; idempotent drafts; concurrent sessions; zero synthetic rows.'
