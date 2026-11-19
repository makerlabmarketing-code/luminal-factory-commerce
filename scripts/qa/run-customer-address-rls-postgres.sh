#!/usr/bin/env bash
set -Eeuo pipefail
# Destructive fixture permitted only for a disposable local PostgreSQL CI database.
if [[ "$COMMERCE_ADMIN_DB_QA_LOCAL_ONLY" != "true" || "$PGHOST" != "127.0.0.1" || "$PGPORT" != "5432" || "$PGDATABASE" != "commerce_admin_contract_ci" || "$PGUSER" != "postgres" ]]; then
  echo 'Refusing non-isolated database for address RLS tests.' >&2
  exit 2
fi
cd "$(dirname "$0")/../.."
psql_ci() { psql -X -q -v ON_ERROR_STOP=1 "$@"; }
psql_ci -f scripts/qa/customer-address-rls-fixture.sql
psql_ci -f supabase/migrations/20260908090700_create_customer_addresses.sql
psql_ci -f supabase/migrations/20260911042616_harden_customer_addresses.sql
psql_ci -f scripts/qa/customer-address-rls-assertions.sql
psql_ci <<'SQL'
drop table public.customer_addresses;
drop function public.commerce_customer_address_guard();
drop function public.commerce_customer_address_reassign_default();
drop function public.commerce_set_updated_at();
drop table public.customers;
drop schema auth cascade;
SQL
echo 'C049_ADDRESS_RLS_PASS: verified A/B ownership on original migrations and isolated DB.'
