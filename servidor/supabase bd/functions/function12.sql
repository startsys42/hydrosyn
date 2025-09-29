create or replace function active_user_associate_system(
    p_admin_uid uuid,
    p_system_id bigint,
    p_user_id uuid
)
returns void as $$
begin
    -- Verificar que el que llama es admin activo
    if not exists (
        select 1
        from admin_users
        where "user" = p_admin_uid
          and is_active = true
    ) then
        raise exception 'Unauthorized: not an admin';
    end if;

    -- Verificar que admin pertenece al sistema
    if not exists (
        select 1
        from systems
        where id = p_system_id
          and admin = p_admin_uid
    ) then
        raise exception 'Unauthorized: admin does not belong to this system';
    end if;

    -- Alternar estado del usuario en el sistema
    update systems_users
    set is_active = not is_active
    where system = p_system_id
      and user_id = p_user_id;

   
end;
$$ language plpgsql security definer;
