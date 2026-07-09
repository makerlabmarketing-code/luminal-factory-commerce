# Supabase Contract

## Ownership

This file is the authoritative owner of Supabase persistence, clients, authentication, RLS, data access boundaries, trusted enforcement, storage, generated database types, schema changes, and shared database assumptions.

Use `commerce-domain.md` for commerce concept meaning, lifecycle semantics, sale types, revenue rules, and domain change rules.

## Role of Supabase

Supabase is the planned shared backend platform for Luminal Factory commerce.

The storefront and ERP should eventually use the same Supabase project.

The shared backend may provide:

- PostgreSQL
- authentication
- storage
- row-level security
- generated database types

## Source of Truth

Persisted commerce state belongs in the database.

Examples:

- products
- variants
- raffles
- entries
- customers
- orders
- payments
- refunds
- shipments
- commission requests

The storefront must not maintain an independent duplicate commerce database.

## Storefront and ERP

The ERP is the operational back office.

The storefront is the public and customer-facing application.

Conceptual access:

    ERP
    -> privileged operational operations

    Storefront server
    -> customer and public application operations

    Storefront browser
    -> RLS-constrained customer operations

Exact access must be enforced using Supabase authentication, RLS, and server boundaries.

## Supabase Clients

Use purpose-specific clients.

Conceptually:

    browser client
    server client
    privileged server-only client

Do not use a privileged service role client in browser code.

Never expose a service role key through a `NEXT_PUBLIC_` environment variable.

## Environment Variables

Public client configuration may include:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Privileged credentials must remain server-only.

Do not commit environment secrets.

Environment-specific local files must be reviewed against `.gitignore`.

## Row-Level Security

Assume RLS is required for customer-owned data.

Examples:

- customer profile
- addresses
- customer orders
- raffle entries
- commission requests

Publicly visible content may use explicit public read policies.

Administrative write access must not depend on hiding a button in the UI.

## Database Types

Prefer generated Supabase database types when the schema becomes stable.

Generated types represent database structure.

They do not replace domain validation or application contracts.

The responsibilities are different:

    Database type
    -> persisted representation and nullability

    Domain model
    -> valid application state

    Input schema
    -> accepted external payload

Do not assume these three are always identical.

## Query Boundaries

Do not write raw Supabase calls inside arbitrary visual components.

Use explicit data or service functions.

Examples:

    getActiveRaffle()
    getPublishedArchiveObjects()
    getProductBySlug()
    createRaffleEntry()
    submitCommissionRequest()

## Public Data

Only publish fields intended for public use.

Do not expose internal fields merely because they exist in a table.

Potential internal data includes:

- internal notes
- cost
- supplier information
- staff identifiers
- selection audit metadata
- finance metadata

Use explicit selections or public views where appropriate.

## Raffle Integrity

Raffle eligibility and entry rules must be enforced at a trusted boundary.

Do not rely only on:

- a disabled button
- client state
- browser date

The database or trusted server operation must verify:

- raffle state
- entry period
- customer identity
- uniqueness rules
- eligibility rules

## Inventory Integrity

Stock changes must be atomic where overselling is possible.

Do not implement stock reservation by reading quantity in the browser, subtracting locally, and writing the result back.

Use a trusted database operation or transaction-oriented server flow.

## Payment Integrity

Payment success must come from the authoritative payment provider or trusted server workflow.

Do not mark an order paid because the browser reached a success page.

Payment-related data must support reconciliation.

## Storage

Supabase Storage may be used for:

- product media
- raffle media
- archive media
- commission reference uploads

Production 3D web assets may be hosted using an appropriate public asset strategy.

Do not expose production sculpt masters or manufacturing source assets as public web files.

## Schema Changes

Database schema changes must be documented.

Do not silently create storefront-specific database assumptions that conflict with ERP usage.

When a schema change affects both applications:

1. Identify the shared contract.
2. Update schema or migration.
3. Update generated types if used.
4. Update domain validation.
5. Inspect ERP impact.
6. Inspect storefront impact.

## Current Constraint

The final shared database schema has not yet been locked.

Do not invent large production schemas prematurely.

During visual implementation, use explicit mock data or adapters where necessary.

Keep mock structures aligned with documented commerce concepts.
