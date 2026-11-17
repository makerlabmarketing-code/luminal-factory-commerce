-- CI-only isolated PostgreSQL contract test. NEVER point at Supabase.
-- The corresponding shell script guards PGHOST, PGDATABASE and user.
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);

CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customers_email_normalized_uidx ON public.customers (lower(email));

CREATE TABLE public.raffle_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO auth.users(id) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
('cccccccc-cccc-4ccc-8ccc-cccccccccccc');

INSERT INTO public.raffle_entries(id,email_normalized) VALUES
('11111111-1111-4111-8111-111111111111','alice@example.com'),
('22222222-2222-4222-8222-222222222222','bob@example.com'),
('33333333-3333-4333-8333-333333333333','alice-new@example.com'),
('44444444-4444-4444-8444-444444444444','alice@example.com');

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.customers, public.raffle_entries TO service_role;
-- Keep source tables private: even with table privileges, RLS denies clients.
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_entries ENABLE ROW LEVEL SECURITY;
