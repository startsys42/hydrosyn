create or replace function deactivate_user_all_systems(
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

    -- Verificar que el admin pertenece al sistema especificado
    if not exists (
        select 1
        from systems
        where id = p_system_id
          and admin = p_admin_uid
    ) then
        raise exception 'Unauthorized: admin does not belong to this system';
    end if;

    -- Desactivar al usuario en todos los sistemas que pertenezcan a este admin
    update systems_users su
    set is_active = false
    from systems s
    where su.system = s.id
      and s.admin = p_admin_uid
      and su.user_id = p_user_id;
end;
$$ language plpgsql security definer;