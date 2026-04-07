create or replace function delete_user_system(
    p_admin_uid uuid,
    p_system_id bigint,
    p_user_id uuid,
    p_delete_all boolean
)
returns void as $$
begin
   
    if not exists (
        select 1
        from admin_users
        where "user" = p_admin_uid
          and is_active = true
    ) then
        raise exception 'Unauthorized: not an admin';
    end if;

   
    if not exists (
        select 1
        from systems
        where id = p_system_id
          and admin = p_admin_uid
    ) then
        raise exception 'Unauthorized: admin does not belong to this system';
    end if;

  
    if p_delete_all then
        delete from systems_users su
        using systems s
        where su.system = s.id
          and s.admin = p_admin_uid
          and su.user_id = p_user_id;
    else
        
        delete from systems_users
        where system = p_system_id
          and user_id = p_user_id;
    end if;
    PERFORM delete_auth_users('chsdrosHADSKADKAujy3746dff');
end;
$$ language plpgsql security definer;
