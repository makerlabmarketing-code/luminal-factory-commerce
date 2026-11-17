#!/usr/bin/env bash
set -Eeuo pipefail

# CI-only destructive disposable fixture. Refuse remote and non-test databases.
if [[ "${COMMERCE_ADMIN_DB_QA_LOCAL_ONLY:-}" != "true"
   || "${PGHOST:-}" != "127.0.0.1"
   || "${PGPORT:-}" != "5432"
   || "${PGDATABASE:-}" != "commerce_admin_contract_ci"
   || "${PGUSER:-}" != "postgres" ]]; then
  echo "Refusing non-isolated PostgreSQL connection." >&2
  exit 2
fi

cd "$(dirname "$0")/../.."
psql_ci() { psql -X -v ON_ERROR_STOP=1 -q "$@"; }

# The existing admin SQL CI test creates anon/authenticated/service_role.
# It has already cleaned all its synthetic data. Isolate this fixture in a
# new schema and only execute the reviewed, unchanged proposed ownership SQL.
psql_ci -f scripts/qa/customer-raffle-ownership-postgres.sql
psql_ci -f docs/qa/customer-raffle-ownership-rollout.sql
psql_ci -f scripts/qa/customer-raffle-ownership-assertions.sql

# Clean up fixture immediately. All objects here exist only on throwaway CI DB.
psql_ci <<'SQL'
DROP FUNCTION public.claim_verified_customer_raffle_history(uuid,text);
DROP TABLE public.raffle_entries;
DROP TABLE public.customers;
DROP SCHEMA auth CASCADE;
SQL
echo 'C049_POSTGRES_OWNERSHIP_PASS: verified owner, no cross-account claim, idempotent replay, changed verified email preserved, guest claim gated.'
