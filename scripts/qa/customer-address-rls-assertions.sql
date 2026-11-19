-- Real RLS queries under simulated Supabase authenticated JWT subjects.
insert into public.customer_addresses
  (id, customer_id, label, recipient_name, phone, administrative_area, locality, address_line1)
values
  ('aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'A home', 'Alice', '0123456789', 'Hanoi', 'Ward A', 'Address A'),
  ('bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'B home', 'Bob', '0123456788', 'Hanoi', 'Ward B', 'Address B');

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);
do $$
declare affected integer;
begin
  if (select count(*) from public.customer_addresses) <> 1 then
    raise exception 'A can read B addresses';
  end if;
  if (select count(*) from public.customers) <> 1 then
    raise exception 'A can read B customer';
  end if;
  update public.customer_addresses set label = 'Unauthorized'
  where id = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'A updated B address'; end if;
  delete from public.customer_addresses
  where id = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'A deleted B address'; end if;
  begin
    insert into public.customer_addresses
      (customer_id, label, recipient_name, phone, administrative_area, locality, address_line1)
    values
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Cross account', 'Alice', '0123456789', 'Hanoi', 'Ward A', 'Address A');
    raise exception 'A inserted into B account';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.customer_addresses
       set customer_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
     where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
    raise exception 'A reassigned address to B';
  exception when insufficient_privilege then null;
  end;
  update public.customer_addresses set label = 'A updated'
  where id = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'A cannot update own address'; end if;
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
do $$
begin
  if (select count(*) from public.customer_addresses) <> 1 then
    raise exception 'B cannot read precisely own address';
  end if;
  if not exists (select 1 from public.customer_addresses where label = 'B home') then
    raise exception 'B cannot see own address';
  end if;
  if exists (select 1 from public.customer_addresses where label = 'A updated') then
    raise exception 'B can read A address';
  end if;
end $$;
reset role;
