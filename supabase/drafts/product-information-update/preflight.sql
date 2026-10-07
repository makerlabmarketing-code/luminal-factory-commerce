-- Read only; compare definition with rollback.sql before approval.
select pg_get_functiondef('public.manage_catalog_product(uuid,text,text,uuid,text,jsonb)'::regprocedure);
select status, count(*) from public.products group by status;
select r.rolname, has_function_privilege(r.rolname,
 'public.manage_catalog_product(uuid,text,text,uuid,text,jsonb)', 'EXECUTE') as can_execute
from pg_roles r where r.rolname in ('anon','authenticated','service_role');
