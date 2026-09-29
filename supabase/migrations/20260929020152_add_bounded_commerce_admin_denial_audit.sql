-- Sample denied Commerce Admin authentication without storing untrusted
-- request headers or letting arbitrary requests create distinct rows.
-- Apply only through the reviewed Commerce Production schema gate.

create table private.commerce_admin_denial_samples (
  bucket_at timestamptz not null,
  category text not null,
  key_id text not null,
  occurred_at timestamptz not null default statement_timestamp(),
  primary key (bucket_at, category, key_id),
  constraint commerce_admin_denial_category_check
    check (category in ('authentication_failed', 'replay')),
  constraint commerce_admin_denial_key_check
    check (
      (category = 'authentication_failed' and key_id = '')
      or (category = 'replay' and char_length(key_id) between 1 and 128
          and key_id ~ '^[A-Za-z0-9._:-]+$')
    )
);

alter table private.commerce_admin_denial_samples enable row level security;
revoke all on table private.commerce_admin_denial_samples from public, anon, authenticated;
grant select, insert, delete on table private.commerce_admin_denial_samples to service_role;

create function public.record_commerce_admin_denial_sample(
  p_category text,
  p_key_id text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_inserted boolean := false;
begin
  if p_category not in ('authentication_failed', 'replay')
    or p_category is null
    or p_key_id is null
    or (p_category = 'authentication_failed' and p_key_id <> '')
    or (p_category = 'replay' and
        (char_length(p_key_id) not between 1 and 128
         or p_key_id !~ '^[A-Za-z0-9._:-]+$'))
  then
    raise exception 'invalid Commerce Admin denial category' using errcode = '22023';
  end if;

  insert into private.commerce_admin_denial_samples (bucket_at, category, key_id)
  values (
    pg_catalog.date_bin('10 minutes'::interval, statement_timestamp(),
                        '2000-01-01 00:00:00+00'::timestamptz),
    p_category,
    p_key_id
  )
  on conflict (bucket_at, category, key_id) do nothing
  returning true into v_inserted;

  return coalesce(v_inserted, false);
end;
$$;

revoke execute on function public.record_commerce_admin_denial_sample(text, text)
  from public, anon, authenticated;
grant execute on function public.record_commerce_admin_denial_sample(text, text)
  to service_role;

select cron.schedule(
  'commerce-admin-denial-sample-cleanup',
  '53 3 * * *',
  $cleanup$
    delete from private.commerce_admin_denial_samples
    where bucket_at < statement_timestamp() - interval '30 days';
  $cleanup$
);
