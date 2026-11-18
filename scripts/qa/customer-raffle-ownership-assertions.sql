-- Runs after executing the exact review-only SQL proposal into isolated CI DB.
SET ROLE service_role;
DO $test$
DECLARE
  a uuid := 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  b uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  c uuid := 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
  cida uuid;
  cidb uuid;
  linked integer;
BEGIN
  IF has_function_privilege('anon', 'public.claim_verified_customer_raffle_history(uuid,text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.claim_verified_customer_raffle_history(uuid,text)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'Anonymous/authenticated roles can execute restricted claim';
  END IF;
  IF NOT has_function_privilege('service_role', 'public.claim_verified_customer_raffle_history(uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Service role cannot execute claim';
  END IF;

  SELECT linked_customer_id, linked_entries INTO cida, linked
  FROM public.claim_verified_customer_raffle_history(a,'alice@example.com');
  IF cida IS NULL OR linked <> 2 THEN RAISE EXCEPTION 'Alice claim failed: %',linked; END IF;

  -- Replays must be idempotent: same owner, no duplicate claims.
  SELECT linked_customer_id, linked_entries INTO cida, linked
  FROM public.claim_verified_customer_raffle_history(a,'alice@example.com');
  IF linked <> 0 THEN RAISE EXCEPTION 'Replay was not idempotent'; END IF;

  -- Simulate an entry already owned by Alice which carries Bob's current
  -- contact email. Bob's sync MUST NOT override the existing owner.
  UPDATE public.raffle_entries
    SET email_normalized = 'bob@example.com'
    WHERE id = '44444444-4444-4444-8444-444444444444';

  SELECT linked_customer_id, linked_entries INTO cidb, linked
  FROM public.claim_verified_customer_raffle_history(b,'bob@example.com');
  IF cidb IS NULL OR cidb = cida OR linked <> 1 THEN
    RAISE EXCEPTION 'Independent customer binding failed';
  END IF;

  IF (SELECT customer_id FROM public.raffle_entries
      WHERE id = '44444444-4444-4444-8444-444444444444') <> cida THEN
    RAISE EXCEPTION 'Bob claimed a raffle entry already owned by Alice';
  END IF;

  -- Change of verified email keeps the same customer ID and previously claimed entries.
  SELECT linked_customer_id, linked_entries INTO cida, linked
  FROM public.claim_verified_customer_raffle_history(a,'alice-new@example.com');
  IF linked <> 1 THEN RAISE EXCEPTION 'New verified email did not link unclaimed entry'; END IF;
  IF (SELECT count(*) FROM public.raffle_entries WHERE customer_id = cida) <> 3 THEN
    RAISE EXCEPTION 'Previously claimed history lost after email change';
  END IF;
  IF (SELECT email FROM public.customers WHERE id=cida) <> 'alice-new@example.com' THEN
    RAISE EXCEPTION 'Verified customer email was not updated';
  END IF;
  -- Identity B cannot overwrite claimed entry from A.
  IF (SELECT customer_id FROM public.raffle_entries WHERE id='11111111-1111-4111-8111-111111111111') <> cida
  THEN RAISE EXCEPTION 'Claimed entry changed ownership'; END IF;

  -- Customer already attached to one Auth user must not be stolen by another.
  BEGIN
    PERFORM public.claim_verified_customer_raffle_history(c,'bob@example.com');
    RAISE EXCEPTION 'Conflicting customer identity was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  BEGIN
    PERFORM public.claim_verified_customer_raffle_history(a,'bob@example.com');
    RAISE EXCEPTION 'Email conflict was accepted';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;

  -- Claimed history must not become unowned when its Customer is deleted.
  -- A future account with the previous email could otherwise inherit it.
  BEGIN
    DELETE FROM public.customers WHERE id = cida;
    RAISE EXCEPTION 'Claimed customer was deleted and history orphaned';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.raffle_entries
      WHERE customer_id = cida) <> 3 THEN
    RAISE EXCEPTION 'Claimed entries were detached from original customer';
  END IF;

  IF (SELECT count(*) FROM public.customers) <> 2 THEN
    RAISE EXCEPTION 'Unexpected customer duplication';
  END IF;
END
$test$;
SELECT 'C049_POSTGRES_OWNERSHIP_PASS' AS result;

RESET ROLE;
