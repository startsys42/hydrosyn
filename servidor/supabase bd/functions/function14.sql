create or replace function is_admin_of_system(p_user uuid, p_system bigint)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from systems
    where id = p_system
      and admin = p_user
  );
$$;