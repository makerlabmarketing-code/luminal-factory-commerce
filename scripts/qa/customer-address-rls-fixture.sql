-- Disposable local CI fixture only. Run script explicitly restricts DB host.
create schema auth;
create function auth.uid()
returns uuid language sql stable set search_path = ''
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;

create table public.customers (
  id uuid primary key,
  auth_user_id uuid unique not null
);
-- The real customers table is RLS protected. The fixture must be too.
alter table public.customers enable row level security;
create function public.commerce_set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
insert into public.customers (id, auth_user_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '11111111-1111-4111-8111-111111111111'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222');
