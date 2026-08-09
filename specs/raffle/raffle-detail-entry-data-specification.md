# Raffle Detail + Entry Data Specification

## Document metadata

- Status: `DRAFT` / `REVIEW_REQUIRED`
- Date: 2026-08-09
- Implementation status: `BLOCKED_PENDING_OWNER_APPROVAL`
- Data status: `PROPOSED_NOT_APPLIED`

This specification defines the proposed contract for `/raffle/[slug]` and a future raffle entry mutation. It does not authorize a database migration.

## Public route contract

- `/raffle/[slug]` resolves a trusted public raffle record by immutable public slug.
- Missing/unpublished raffle returns not-found or truthful unavailable state.
- Public detail may expose only approved release copy, media, timestamps, rules summary and normalized presentation state.
- Browser code never decides that a raffle is open solely from local time.

## Proposed authoritative raffle fields

Conceptual fields, not approved DB columns:
- `id` UUID
- `slug` unique public identifier
- `status` canonical lifecycle value
- `opens_at` timestamptz
- `closes_at` timestamptz
- `title`
- `summary`
- `rules_version`
- `is_published`
- created/updated audit timestamps

Product/variant linkage remains a separate relationship and must not collapse Raffle into Product.

## Proposed entry contract

Conceptual fields:
- `id` UUID
- `raffle_id` UUID
- normalized identity key
- contact email
- display/name
- rules version accepted
- accepted timestamp
- created timestamp
- idempotency/request token if used

No payment/order/inventory columns belong on the entry record by default.

## Identity decision gate

Two supported designs require owner choice before implementation:

### Option A: guest email entry
- normalize email server-side
- uniqueness guard: `(raffle_id, normalized_email)`
- lowest friction
- requires anti-abuse, privacy-safe duplicate response and careful RLS/server mutation boundary

### Option B: authenticated customer entry
- uniqueness guard: `(raffle_id, auth_user_id)`
- stronger stable identity
- adds account/auth friction and requires customer-profile contract first

Do not create both identity paths in the first implementation.

## Proposed Supabase boundary

If Supabase is selected after approval:
- migration files must be committed before production application
- generated database types must be refreshed
- all entry writes must pass trusted server validation or narrowly designed RPC/policy boundary
- anonymous clients must not receive unrestricted table insert/select access
- no public query may enumerate entries
- service-role secrets remain server-only
- RLS must be enabled on entrant-bearing tables

## Proposed constraints

Hard constraints should include:
- unique public raffle slug
- close time later than open time when both exist
- one valid entry per chosen normalized identity per raffle
- rules acceptance/version required for accepted entries
- foreign-key integrity from entry to raffle

Idempotency should make retry safe even under network uncertainty.

## Mutation behavior

Server-side entry operation must:
1. resolve raffle by trusted identifier
2. verify publication and authoritative open state
3. normalize/validate identity
4. apply eligibility rules approved for the release
5. enforce uniqueness/idempotency transactionally
6. persist one entry or return existing/duplicate semantic result
7. return a minimal public acknowledgement, never sensitive internal state

## Response semantics

Suggested public outcomes:
- `submitted`
- `already_entered`
- `raffle_not_open`
- `ineligible`
- `validation_error`
- `rate_limited`
- `temporarily_unavailable`

Do not expose raw Postgres constraint names or internal exception messages.

## Anti-abuse baseline

Before live entry:
- server-side rate limiting
- request size limits
- bot/spam mitigation appropriate to the chosen identity model
- duplicate guard in DB, not only application memory
- structured logging without leaking unnecessary PII
- correlation/request ID for operational diagnosis

## Timing

- Database/server timestamps are authoritative.
- Store timestamps as timezone-aware instants.
- Public display uses `Asia/Ho_Chi_Minh` for the current storefront contract.
- Client countdown may be decorative only; it cannot grant eligibility.
- uncertain/stale state fails closed.

## Winner/payment/order boundary

Entry records must not become orders merely because a winner is selected.

A separate approved winner/payment contract must define the transition from selected winner to payment opportunity and eventual order. ERP remains the owner of administrative winner operations unless a later architecture explicitly changes that boundary.

## Migration gate

Before any Supabase write:
- owner approves identity model and entry fields
- inspect current Supabase schema/project state directly
- produce migration + rollback plan
- review RLS and indexes
- verify Preview with the intended environment
- verify database contract before merge

Until then: `NO_DATABASE_CHANGE_ALLOWED`.

## Owner approval decisions

1. Identity: guest email or authenticated customer.
2. One-entry uniqueness rule.
3. Minimal entry fields.
4. Exact eligibility rules required in the first live release.
5. Whether Supabase is the persistence layer for raffle/entries.
6. Whether duplicate submission returns the existing entry reference or only a generic already-entered acknowledgement.
