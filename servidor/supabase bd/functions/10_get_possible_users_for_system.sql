create function get_possible_users_for_system(p_system bigint, p_user uuid)
returns table( user_id uuid, email varchar) as $$
begin
  
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

  
   return query
    select distinct u.id, u.email
    from systems_users su
    join auth.users u on su.user_id = u.id
    join systems s on su.system = s.id
    where s.admin = p_user         
      and s.id <> p_system         
      and su.user_id not in (
        select su2.user_id
        from systems_users su2
        where su2.system = p_system    
      );
end;
$$ language plpgsql security definer;
