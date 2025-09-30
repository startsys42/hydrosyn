create or replace function get_users_for_system(p_system bigint, p_user uuid)
returns table(su_id bigint, user_id uuid, email varchar, su_is_active boolean) as $$
begin
  -- Comprueba que el usuario que llama es admin del sistema
  if not exists (
    select 1
    from admin_users
    where "user" = p_user
      and is_active = true
  ) then
    raise exception 'Unauthorized';
  end if;
  if not exists (
    select 1 
    from systems
    where id = p_system
      and admin = p_user
  ) then
    raise exception 'Unauthorized';
  end if;

  -- Devuelve los usuarios asociados al sistema
  return query
    select su.id, su.user_id, u.email, su.is_active as su_is_active
    from systems_users su
    join auth.users u on su.user_id = u.id
    where su.system = p_system;
end;
$$ language plpgsql security definer;
