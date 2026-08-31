import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migrationPath = "supabase/migrations/20260829151610_customer_cart_merge.sql";
const sql = readFileSync(migrationPath, "utf8");

test("customer cart merge receipt stays private, bounded and expiring", () => {
  assert.match(sql, /create table private\.customer_cart_merge_receipts/i);
  assert.match(sql, /guest_token_hash bytea primary key/i);
  assert.match(sql, /octet_length\(guest_token_hash\) = 32/i);
  assert.match(sql, /alter table private\.customer_cart_merge_receipts enable row level security/i);
  assert.match(
    sql,
    /revoke all on table private\.customer_cart_merge_receipts\s+from public, anon, authenticated/i,
  );
  assert.match(
    sql,
    /grant select, insert, delete on table private\.customer_cart_merge_receipts\s+to service_role/i,
  );
  assert.match(sql, /v_now \+ interval '37 days'/i);
  assert.match(sql, /customer_cart_merge_receipts_expiry_idx/i);
});

test("merge RPC is service-role-only invoker code with a fixed trust boundary", () => {
  assert.match(
    sql,
    /create function public\.merge_verified_customer_guest_cart\(\s*p_auth_user_id uuid,\s*p_verified_email text,\s*p_guest_token_hash text\s*\)/i,
  );
  assert.match(sql, /security invoker\s+set search_path = ''/i);
  assert.match(sql, /set statement_timeout = '5s'/i);
  assert.match(sql, /set lock_timeout = '2s'/i);
  assert.match(
    sql,
    /revoke execute on function public\.merge_verified_customer_guest_cart\(uuid, text, text\)\s+from public, anon, authenticated/i,
  );
  assert.match(
    sql,
    /grant execute on function public\.merge_verified_customer_guest_cart\(uuid, text, text\)\s+to service_role/i,
  );
  assert.doesNotMatch(sql, /security definer/i);
});

test("credential handling is fixed-length, decoded once and never returned", () => {
  assert.match(sql, /length\(p_guest_token_hash\) <> 66/i);
  assert.match(sql, /substring\(p_guest_token_hash from 3\) !~ '\^\[0-9a-f\]\{64\}\$'/i);
  assert.match(sql, /v_hash := decode\(substring\(p_guest_token_hash from 3\), 'hex'\)/i);
  assert.match(
    sql,
    /returns table \(\s*merge_state text,\s*unavailable_line_count integer,\s*capped_line_count integer\s*\)/i,
  );
  assert.doesNotMatch(sql, /returns table[\s\S]{0,200}(guest_token_hash|verified_email|customer_id|cart_id)/i);
});

test("cart-line writes and merge use consistent parent locking", () => {
  assert.match(sql, /create function private\.lock_active_cart_for_line_write\(\)/i);
  assert.match(sql, /where carts\.id = new\.cart_id\s+for update/i);
  assert.match(sql, /before insert or update of cart_id, product_id, variant_id, requested_quantity/i);
  assert.match(sql, /order by carts\.id\s+for update/i);
  assert.match(sql, /order by items\.id\s+for update/i);
  assert.match(sql, /pg_advisory_xact_lock/i);
});

test("merge is idempotent, non-enumerating and refuses silent email linking", () => {
  assert.match(sql, /where receipts\.guest_token_hash = v_hash/i);
  assert.match(sql, /v_receipt_auth_user_id = p_auth_user_id/i);
  assert.match(sql, /select 'cart_unavailable'::text, 0, 0/i);
  assert.match(sql, /lower\(btrim\(customers\.email\)\) = p_verified_email/i);
  assert.match(sql, /customers\.auth_user_id is distinct from p_auth_user_id/i);
  assert.match(sql, /select 'identity_conflict'::text, 0, 0/i);
});

test("valid lines merge once, cap at 99 and invalid catalog lines are counted", () => {
  assert.match(sql, /products\.status = 'published'/i);
  assert.match(sql, /products\.published_at <= v_now/i);
  assert.match(sql, /variants\.product_id = products\.id/i);
  assert.match(sql, /variants\.is_active/i);
  assert.match(sql, /v_unavailable := v_unavailable \+ 1/i);
  assert.match(sql, /least\(v_combined_quantity, 99\)/i);
  assert.match(sql, /v_capped := v_capped \+ 1/i);
  assert.match(sql, /set status = 'converted',\s+guest_token_hash = null/i);
});

test("merge has no inventory, order, payment, raffle or ERP mutation authority", () => {
  for (const table of [
    "inventory_items",
    "orders",
    "order_items",
    "payments",
    "refunds",
    "raffles",
    "raffle_entries",
  ]) {
    assert.doesNotMatch(
      sql,
      new RegExp(`(?:insert\\s+into|update|delete\\s+from)\\s+public\\.${table}\\b`, "i"),
    );
  }
  assert.doesNotMatch(sql, /user_metadata|raw_user_meta_data|http_request|net\.http/i);
});

test("receipt cleanup is database-local and has one named hourly job", () => {
  assert.match(sql, /cron\.schedule\(\s*'commerce-customer-cart-merge-receipt-cleanup'/i);
  assert.match(sql, /'29 \* \* \* \*'/i);
  assert.match(sql, /delete from private\.customer_cart_merge_receipts/i);
});
