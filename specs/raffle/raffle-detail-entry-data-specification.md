# Raffle Detail + Entry Data Specification

## Document metadata

- Status: `APPROVED` / `IMPLEMENTATION_PLANNING_READY`
- Date: 2026-08-09
- Owner approval: `2026-08-09`
- Implementation status: `READY_FOR_SCHEMA_INSPECTION_AND_TECHNICAL_PLAN`
- Data status: `APPROVED_CONTRACT_NOT_APPLIED`

This specification defines the approved contract for `/raffle/[slug]` and the first raffle entry mutation. It authorizes technical planning and direct inspection of the current commerce Supabase project, but no migration may be applied until the actual schema/RLS plan has been reviewed on a dedicated implementation branch.

## Public route contract

- `/raffle/[slug]` resolves a trusted public raffle record by immutable public slug.
- Missing/unpublished raffle returns not-found or truthful unavailable state.
- Public detail may expose only approved release copy, media, timestamps, rules summary and normalized presentation state.
- Browser code never decides that a raffle is open solely from local time.

## Approved authoritative raffle contract

Conceptual fields to map to the real existing schema or a reviewed migration after inspection:
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

## Approved entry contract

Conceptual fields:
- `id` UUID
- `raffle_id` UUID
- normalized email identity key
- contact email
- display/name
- rules version accepted
- accepted timestamp
- created timestamp
- idempotency/request token if used

No payment/order/inventory columns belong on the entry record by default.

## Approved identity model

First implementation uses **guest email entry** only.

- Normalize email server-side.
- Hard uniqueness guard: `(raffle_id, normalized_email)` or an equivalent normalized identity constraint supported by the inspected schema.
- No authenticated customer account is required for entry.
- Do not build parallel guest/auth identity paths in the first slice.

## Approved Supabase boundary

Supabase is the intended persistence layer for raffle/entry data, subject to direct inspection of the current commerce project before migration design.

Required rules:
- migration files must be committed before production application
- generated database types must be refreshed when applicable
- all entry writes must pass trusted server validation or a narrowly designed RPC/policy boundary
- anonymous clients must not receive unrestricted table insert/select access
- no public query may enumerate entries
- service-role secrets remain server-only
- RLS must be enabled on entrant-bearing tables

## Approved constraints

Hard constraints should include, mapped to actual schema after inspection:
- unique public raffle slug
- close time later than open time when both exist
- one valid entry per normalized email per raffle
- rules acceptance/version required for accepted entries
- foreign-key integrity from entry to raffle

Idempotency must make retry safe even under network uncertainty.

## Mutation behavior

Server-side entry operation must:
1. resolve raffle by trusted identifier
2. verify publication and authoritative open state
3. normalize/validate email
4. apply eligibility rules approved for the release
5. enforce uniqueness/idempotency transactionally
6. persist one entry or return stable duplicate semantics
7. return a minimal public acknowledgement, never sensitive internal state

## Response semantics

Approved public outcomes:
- `submitted`
- `already_entered`
- `raffle_not_open`
- `ineligible`
- `validation_error`
- `rate_limited`
- `temporarily_unavailable`

Privacy behavior:
- a newly submitted entry may receive its own public acknowledgement/reference
- duplicate submission returns a generic `already_entered` acknowledgement by default
- do not expose raw Postgres constraint names, internal exception messages, or private details from an existing entry

## Anti-abuse baseline

Before live entry:
- server-side rate limiting
- request size limits
- bot/spam mitigation appropriate to guest email entry
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
1. inspect current commerce Supabase schema/project state directly
2. inspect existing migrations, naming conventions, RLS policies, extensions, and generated types
3. map this conceptual contract onto existing structures where possible instead of creating parallel tables unnecessarily
4. produce migration + rollback plan
5. review indexes, uniqueness, RLS, and trusted write boundary
6. verify Preview with the intended environment
7. verify database contract before merge

Until those steps are complete: `NO_DATABASE_CHANGE_APPLIED_YET`.

## Owner approval record

Approved on 2026-08-09:
- identity: guest email
- uniqueness: one valid entry per normalized email per raffle
- minimal entry fields: email + display/name + rules/privacy agreement
- Supabase: intended persistence layer, pending direct schema inspection
- duplicate response: generic privacy-safe `already_entered`
- payment/order/winner administration: separately gated

Eligibility details specific to a real release may still require release-level configuration/specification before opening that raffle to entries.
