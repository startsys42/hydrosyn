create or replace function get_users_for_system(p_system bigint, p_user uuid)
returns table(su_id bigint, user_id uuid, email varchar, su_is_active boolean) as $$
begin
  
  if not exists (
    select 1
    from admin_users
    where admin_users."user" = p_user  
      and admin_users.is_active = true
  ) then
    raise exception 'Unauthorized';
  end if;
  
  if not exists (
    select 1 
    from systems
    where systems.id = p_system
      and systems.admin = p_user
  ) then
    raise exception 'Unauthorized';
  end if;

 
  return query
    select su.id, su.user_id, u.email, su.is_active as su_is_active
    from systems_users su
    join auth.users u on su.user_id = u.id
    where su.system = p_system;
end;
$$ language plpgsql security definer;