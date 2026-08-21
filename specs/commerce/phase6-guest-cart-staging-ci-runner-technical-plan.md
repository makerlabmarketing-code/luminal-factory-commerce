# Phase 6 Guest Cart Staging CI Runner Technical Plan

## Document metadata

- **Status:** `CODE_COMPLETE_LOCAL_VALIDATION_REQUIRED`
- **Date:** 2026-08-21
- **Runtime:** no Vercel or Supabase runtime change
- **Depends on:** `phase6-guest-cart-staging-runbook.md`

## Problem

The reviewed verifier is correct but the current Codex Cloud outbound proxy cannot send its POST requests to the protected Vercel Preview. Browser inspection can prove the page and deployment exist, but it cannot replace the POST-only API smoke or safely manufacture a cart request when the storefront has no Cart UI.

The backend staging gate therefore remains incomplete. Cart UI and Auth must not be connected merely because the Preview built successfully.

## Bounded solution

Add one manual GitHub Actions workflow that runs the existing verifier from an environment with normal HTTPS egress. The workflow:

- is `workflow_dispatch` only and never runs on push or pull request;
- accepts only the reviewed `disabled` or `enabled` mode and an isolated Preview origin;
- relies on the verifier's production-host denylist and exact URL validation;
- serializes runs with one concurrency group;
- has read-only repository permission;
- exposes the Vercel Automation Bypass and Commerce Supabase secret only through GitHub Actions secrets;
- requires an explicit boolean confirmation before the enabled create/delete smoke;
- reuses the verifier's exact-cart cleanup in `finally`;
- does not edit Vercel variables, deploy, enable Auth, publish products or change Supabase schema.

## Operator configuration

Configure these repository-level GitHub Actions secrets before the first run:

- `VERCEL_AUTOMATION_BYPASS_SECRET`: the existing project-scoped Vercel automation bypass value;
- `COMMERCE_SUPABASE_SECRET_KEY`: the Commerce project server-only secret key.

Do not put either value in workflow inputs, repository variables, logs, screenshots, application runtime code or chat. The Supabase origin is non-secret and remains fixed to the reviewed Commerce project inside the workflow/verifier contract.

## Execution gate

1. Merge this runner once after local and PR quality gates pass.
2. Use a Preview whose Vercel source commit is proven to equal the full selected Git ref SHA.
3. Keep the branch-scoped Preview flag false and run `disabled` first without write confirmation.
4. Only after that passes, use the already approved enabled-smoke runbook: set only the exact Preview flag true, redeploy once, select `enabled`, and check write confirmation.
5. Confirm exactly one smoke cart is created and deleted, then return Preview runtime to false with the minimum required redeployment.

Production and Auth remain disabled throughout. This runner does not authorize Cart UI, permanent accounts, OTP, Turnstile, saved addresses, checkout or payment.

## Validation

- Static tests prove the workflow is manual-only, read-only, serialized and confirmation-gated.
- `npm run check` validates tests, lint, types, security gates and production build.
- The actual disabled/enabled results are external staging evidence and cannot be claimed by local tests.
