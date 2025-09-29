create function get_possible_users_for_system(p_system bigint, p_user uuid)
returns table( user_id uuid, email text) as $$
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
    select distinct u.id, u.email
    from systems_users su
    join auth.users u on su.user_id = u.id
    join systems s on su.system = s.id
    where s.admin = p_user         -- otros sistemas del mismo admin
      and s.id <> p_system         -- distintos al actual
      and su.user_id not in (
        select user_id
        from systems_users
        where system = p_system    -- usuarios ya asociados al sistema actual
      );
end;
$$ language plpgsql security definer;
