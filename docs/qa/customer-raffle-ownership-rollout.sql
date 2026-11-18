-- REVIEW-ONLY SQL. DO NOT EXECUTE ON PRODUCTION BEFORE C-049 APPROVAL.
-- After review, create a properly named Supabase CLI migration and test on
-- an isolated database. This file is a proposal, not a migration history entry.
-- customer_id links a verified customer to each immutable entry; shipping
-- snapshots remain in their existing protected table.
-- RESTRICT prevents deleted customers from orphaning previously claimed entries
-- and allowing future holders of a recycled email to claim them.
BEGIN;

ALTER TABLE public.raffle_entries
  ADD COLUMN IF NOT EXISTS customer_id uuid
  REFERENCES public.customers(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS raffle_entries_customer_created_idx
  ON public.raffle_entries (customer_id, created_at DESC)
  WHERE customer_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.claim_verified_customer_raffle_history(
  p_auth_user_id uuid,
  p_verified_email text
) RETURNS TABLE (linked_customer_id uuid, linked_entries integer)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
SET statement_timeout = '5s'
SET lock_timeout = '2s'
AS $function$
DECLARE
  v_email text := lower(btrim(p_verified_email));
  v_customer_id uuid;
  v_customer_email text;
  v_linked integer := 0;
BEGIN
  -- This RPC is callable only by the server's service_role; the route must
  -- call Supabase Auth getUser() and verify email_confirmed_at before RPC.
  IF p_auth_user_id IS NULL OR v_email IS NULL
    OR p_verified_email IS DISTINCT FROM v_email
    OR length(v_email) > 254
    OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+$'
  THEN
    RAISE EXCEPTION 'invalid verified customer identity' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('customer-raffle-claim:' || p_auth_user_id::text, 0)
  );

  SELECT c.id, c.email INTO v_customer_id, v_customer_email
  FROM public.customers c
  WHERE c.auth_user_id = p_auth_user_id
  FOR UPDATE;

  -- An authenticated customer may change their confirmed email without
  -- losing the stable customer ID or already linked raffle history.
  -- However, a newly verified email may not belong to another customer.
  IF v_customer_id IS NOT NULL AND lower(btrim(v_customer_email)) <> v_email THEN
    IF EXISTS (
      SELECT 1 FROM public.customers c
      WHERE lower(btrim(c.email)) = v_email AND c.id <> v_customer_id
    ) THEN
      RAISE EXCEPTION 'customer identity conflict' USING ERRCODE = '23505';
    END IF;
    UPDATE public.customers c
      SET email = v_email, updated_at = statement_timestamp()
      WHERE c.id = v_customer_id AND c.auth_user_id = p_auth_user_id;
  END IF;

  IF v_customer_id IS NULL THEN
    -- Never capture an existing customer row belonging to another identity.
    IF EXISTS (
      SELECT 1 FROM public.customers c WHERE lower(btrim(c.email)) = v_email
    ) THEN
      RAISE EXCEPTION 'customer identity conflict' USING ERRCODE = '23505';
    END IF;
    INSERT INTO public.customers(auth_user_id,email)
      VALUES(p_auth_user_id,v_email)
      RETURNING id INTO v_customer_id;
  END IF;

  -- Never steal a row already claimed by another authenticated customer.
  UPDATE public.raffle_entries re
    SET customer_id = v_customer_id
    WHERE re.email_normalized = v_email
      AND re.customer_id IS NULL;
  GET DIAGNOSTICS v_linked = ROW_COUNT;
  RETURN QUERY SELECT v_customer_id, v_linked;
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_verified_customer_raffle_history(uuid,text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_verified_customer_raffle_history(uuid,text)
  TO service_role;

COMMIT;

-- Security QA:
-- 1. Executing RPC as anon/authenticated must be denied.
-- 2. Different verified users must never claim each other's customer_id.
-- 3. Repeated claim is idempotent (linked_entries=0).
-- 4. Existing claimed entries may not be reassigned.
-- 5. Missing/unverified email or conflicting customer email must fail closed.
-- 8. Same auth subject may change verified email without losing old history.
-- 9. Only the new verified email may claim new unlinked entries; old email must not auto-claim.
-- 6. Direct select on private raffle shipping data remains denied.
-- 7. Deploy schema before enabling COMMERCE_CUSTOMER_RAFFLE_HISTORY_ENABLED.
-- 10. Deleting a Customer with claimed entries must be blocked, not orphan history.
