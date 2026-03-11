create or replace function public.insert_record_for_system(
    p_system_id bigint,
    p_tank_id bigint,
    p_user uuid,
    p_volume numeric,
    p_created_at timestamptz default null
)
returns void as $$
declare
    record_date timestamptz;
begin
    -- Verificar permisos
    if not exists (
        select 1
        from public.admin_users a
        join public.systems s on s.admin = a."user"
        where a."user" = p_user
          and a.is_active = true
          and s.id = p_system_id
    ) then
        if not exists (
            select 1
            from public.systems_users su
            where su.user_id = p_user
              and su.is_active = true
              and su.system = p_system_id
        ) then
            raise exception 'Unauthorized: user is not active in this system';
        end if;
    end if;

    -- Determinar fecha
    record_date := coalesce(p_created_at, now());

    -- Insertar registro
    insert into public.records (tank, "user", volume, created_at)
    values (p_tank_id, p_user, p_volume, record_date);
end;
$$language plpgsql security definer volatile;